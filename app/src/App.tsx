import { useState, useEffect } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// components
import Editor from "./components/editor";

type Branch = { id: string; name: string; doc: Y.Doc; provider: WebsocketProvider };
type RemoteBranch = { id: string; name: string; has_password: boolean };

const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/editor/";
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

const App = () => {
  const [user, setUser] = useState<string>(() => localStorage.getItem("syncdraft-user") || "");
  const [formData, setFormData] = useState<string>("");
  const [joinByNameModalOpen, setJoinByNameModalOpen] = useState(false);
  const [joinByNameName, setJoinByNameName] = useState("");
  const [joinByNamePassword, setJoinByNamePassword] = useState("");
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState("main");
  const [remoteBranches, setRemoteBranches] = useState<RemoteBranch[]>([]);
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchPassword, setNewBranchPassword] = useState("");
  
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinBranchTarget, setJoinBranchTarget] = useState<RemoteBranch | null>(null);
  const [joinPassword, setJoinPassword] = useState("");

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/branches/`);
      const data = await res.json();
      if (data.branches) setRemoteBranches(data.branches);
    } catch (e) {
      console.error("Failed to fetch branches", e);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (user && branches.length === 0 && !isInitializing) {
      setIsInitializing(true);
      const doc = new Y.Doc();
      const provider = new WebsocketProvider(wsUrl, "my-room", doc);
      setBranches([{ id: "main", name: "main", doc, provider }]);
    }
  }, [user, branches, isInitializing]);

  const activeBranch = branches.find(b => b.id === activeBranchId);

  const handleCreateBranchClick = () => {
    setNewBranchName("");
    setNewBranchPassword("");
    setIsModalOpen(true);
  };

  const confirmCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const mainBranch = branches.find(b => b.id === "main");
    if (!mainBranch) return;
    
    const newId = `branch-${Math.random().toString(36).substr(2, 9)}`;
    const newDoc = new Y.Doc();
    
    Y.applyUpdate(newDoc, Y.encodeStateAsUpdate(mainBranch.doc));
    
    try {
      await fetch(`${apiUrl}/api/branches/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: newId,
          name: newBranchName,
          password: newBranchPassword
        })
      });
      fetchBranches();
    } catch (e) {
      console.error("Error creating branch", e);
    }
    
    const providerOpts = newBranchPassword ? { params: { pwd: newBranchPassword } } : {};
    const newProvider = new WebsocketProvider(wsUrl, newId, newDoc, providerOpts);
    
    setBranches([...branches, { id: newId, name: newBranchName, doc: newDoc, provider: newProvider }]);
    setActiveBranchId(newId);
    setIsModalOpen(false);
  };
  
  const joinBranch = async (branch: RemoteBranch) => {
    const existing = branches.find(b => b.id === branch.id);
    if (existing) {
      setActiveBranchId(branch.id);
      return;
    }
    
    if (branch.has_password) {
      setJoinBranchTarget(branch);
      setJoinPassword("");
      setJoinModalOpen(true);
    } else {
      connectToBranch(branch.id, branch.name, "");
    }
  };

  const connectToBranch = (id: string, name: string, password: string) => {
    const newDoc = new Y.Doc();
    const providerOpts = password ? { params: { pwd: password } } : {};
    const newProvider = new WebsocketProvider(wsUrl, id, newDoc, providerOpts);
    
    // Listen for disconnects indicating bad password
    newProvider.on('connection-close', (event: any) => {
      console.log('Connection closed', event);
    });

    setBranches(prev => [...prev, { id, name, doc: newDoc, provider: newProvider }]);
    setActiveBranchId(id);
  };

  const confirmJoinBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinBranchTarget) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/branches/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: joinBranchTarget.id,
          password: joinPassword
        })
      });
      
      if (res.ok) {
        connectToBranch(joinBranchTarget.id, joinBranchTarget.name, joinPassword);
        setJoinModalOpen(false);
        setJoinBranchTarget(null);
      } else {
        alert("Invalid Password!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmJoinByName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinByNameName.trim()) return;

    try {
      // Fetch latest branches to ensure we can find newly created ones without refreshing
      const resBranches = await fetch(`${apiUrl}/api/branches/`);
      const data = await resBranches.json();
      const latestBranches: RemoteBranch[] = data.branches || [];
      
      const targetBranch = latestBranches.find(b => b.name.toLowerCase() === joinByNameName.trim().toLowerCase());
      
      if (!targetBranch) {
        alert("Draft not found! Please check the spelling.");
        return;
      }

      if (targetBranch.has_password && !joinByNamePassword) {
        alert("This draft requires a password!");
        return;
      }

      const res = await fetch(`${apiUrl}/api/branches/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: targetBranch.id,
          password: joinByNamePassword
        })
      });
      
      if (res.ok) {
        connectToBranch(targetBranch.id, targetBranch.name, joinByNamePassword);
        setJoinByNameModalOpen(false);
        setJoinByNameName("");
        setJoinByNamePassword("");
        setRemoteBranches(latestBranches); // Update UI with latest branches
      } else {
        alert("Invalid Password!");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server.");
    }
  };

  const mergeToMain = () => {
    const mainBranch = branches.find(b => b.id === "main");
    const currentBranch = branches.find(b => b.id === activeBranchId);
    if (!mainBranch || !currentBranch || activeBranchId === "main") return;

    Y.applyUpdate(mainBranch.doc, Y.encodeStateAsUpdate(currentBranch.doc));
    alert(`Successfully merged '${currentBranch.name}' into main!`);
    setActiveBranchId("main");
  };

  if (user === "") {
    return (
      <div className="fixed w-full flex justify-center items-center h-screen top-0 left-0 bg-gradient-to-br from-gray-900 to-black">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const newUser = `${formData}-${Math.round(Math.random() * 1000)}`;
            setUser(newUser);
            localStorage.setItem("syncdraft-user", newUser);
          }}
          className="flex flex-col gap-y-4 w-96 glass-panel p-8 rounded-2xl border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wide">SyncDraft</h2>
          <p className="text-gray-400 text-sm mb-4">Connect securely to start collaborating.</p>
          
          <label htmlFor="username" className="text-gray-300 text-xs font-bold uppercase tracking-wider">Display Name</label>
          <input
            type="text"
            id="username"
            placeholder="e.g. Neo"
            required
            className="bg-black/50 border border-gray-600/50 p-3 rounded-lg outline-none focus:border-cyan-400 text-white transition-all focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            value={formData}
            onChange={(e) => setFormData(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transform hover:-translate-y-0.5"
            >
              Enter Workspace
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 flex flex-col h-screen max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-2">
            SyncDraft
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Active:</span>
            <select 
              value={activeBranchId} 
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="bg-black/50 border border-cyan-500/30 text-cyan-200 text-sm rounded px-3 py-1 outline-none font-medium"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name === 'main' ? '🌲 main' : `🌿 ${b.name}`}</option>
              ))}
            </select>
            
            <div className="w-px h-6 bg-gray-700 mx-2"></div>
            
            <span className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Remote:</span>
            <div className="flex gap-2 items-center">
              <button onClick={() => { setJoinByNameName(""); setJoinByNamePassword(""); setJoinByNameModalOpen(true); }} className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 px-3 py-1 rounded transition-colors border border-blue-500/30 font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                🔗 Join Draft
              </button>
              <div className="flex gap-2 overflow-x-auto max-w-[200px] pb-1 custom-scrollbar">
                {remoteBranches.map(b => (
                  <button key={b.id} onClick={() => joinBranch(b)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded transition-colors border border-gray-600 flex items-center gap-1 whitespace-nowrap">
                    {b.name} {b.has_password && "🔒"}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCreateBranchClick} className="ml-2 text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 px-3 py-1 rounded transition-colors border border-purple-500/30 font-semibold shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              + New Draft
            </button>
            {activeBranchId !== "main" && (
              <button onClick={mergeToMain} className="text-xs bg-green-500/20 text-green-300 hover:bg-green-500/40 px-3 py-1 rounded transition-colors border border-green-500/30 font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)] ml-2">
                ✓ Merge to Main
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 glass-panel px-5 py-2 rounded-full border border-cyan-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]"></div>
          <span className="text-sm text-gray-300">Connected as <span className="text-white font-semibold">{user}</span></span>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <form 
            onSubmit={confirmCreateBranch}
            className="flex flex-col gap-4 w-96 glass-panel p-8 rounded-2xl border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.2)] relative"
          >
            <h2 className="text-2xl font-bold text-white tracking-wide">Create New Draft</h2>
            <p className="text-xs text-gray-400 mb-2">
              Create an isolated workspace branched from the current main document. Optionally lock it with a password.
            </p>
            
            <label className="text-gray-300 text-xs font-bold uppercase tracking-wider">Branch Name</label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Alternate Ending"
              className="bg-black/50 border border-gray-600/50 p-3 rounded-lg outline-none focus:border-purple-400 text-white text-sm transition-colors"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
            />

            <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mt-2">Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank for public access"
              className="bg-black/50 border border-gray-600/50 p-3 rounded-lg outline-none focus:border-purple-400 text-white text-sm transition-colors"
              value={newBranchPassword}
              onChange={(e) => setNewBranchPassword(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newBranchName.trim()}
                className="bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white text-sm font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                Create Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {joinModalOpen && joinBranchTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <form 
            onSubmit={confirmJoinBranch}
            className="flex flex-col gap-4 w-96 glass-panel p-8 rounded-2xl border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
          >
            <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              🔒 Unlock Branch
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              The branch <span className="text-white font-semibold">{joinBranchTarget.name}</span> requires a password to access.
            </p>
            
            <input
              type="password"
              autoFocus
              required
              placeholder="Enter password"
              className="bg-black/50 border border-gray-600/50 p-3 rounded-lg outline-none focus:border-blue-400 text-white text-sm transition-colors"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!joinPassword.trim()}
                className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
              >
                Unlock & Join
              </button>
            </div>
          </form>
        </div>
      )}

      {joinByNameModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <form 
            onSubmit={confirmJoinByName}
            className="flex flex-col gap-4 w-96 glass-panel p-8 rounded-2xl border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)] relative"
          >
            <h2 className="text-2xl font-bold text-white tracking-wide">Join Draft</h2>
            <p className="text-xs text-gray-400 mb-2">
              Enter the name of the draft you want to join.
            </p>
            
            <label className="text-gray-300 text-xs font-bold uppercase tracking-wider">Draft Name</label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Alternate Ending"
              className="bg-black/50 border border-gray-600/50 p-3 rounded-lg outline-none focus:border-blue-400 text-white text-sm transition-colors"
              value={joinByNameName}
              onChange={(e) => setJoinByNameName(e.target.value)}
            />

            <label className="text-gray-300 text-xs font-bold uppercase tracking-wider mt-2">Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank if public"
              className="bg-black/50 border border-gray-600/50 p-3 rounded-lg outline-none focus:border-blue-400 text-white text-sm transition-colors"
              value={joinByNamePassword}
              onChange={(e) => setJoinByNamePassword(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setJoinByNameModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!joinByNameName.trim()}
                className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={`flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col relative mb-10 transition-all ${activeBranchId !== 'main' ? 'border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border border-cyan-500/20'}`}>
        {activeBranch && (
          <Editor key={activeBranch.id} username={user} ydoc={activeBranch.doc} provider={activeBranch.provider} />
        )}
      </div>
    </div>
  );
};

export default App;
