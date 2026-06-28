import { randomInt } from "remirror";

import { useCallback, useEffect, useState } from "react";
import { spawnParticles } from "../../utils/powerMode";

import "remirror/styles/all.css";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { InvalidContentHandler } from "remirror";
import {
  BoldExtension,
  ItalicExtension,
  CalloutExtension,
  CodeBlockExtension,
  CodeExtension,
  HistoryExtension,
  LinkExtension,
  UnderlineExtension,
  HeadingExtension,
  OrderedListExtension,
  ListItemExtension,
  BulletListExtension,
  FontSizeExtension,
  CollaborationExtension,
  YjsExtension,
} from "remirror/extensions";

import {
  Remirror,
  useRemirror,
  EditorComponent,
  OnChangeJSON,
  useRemirrorContext,
} from "@remirror/react";

export interface Props {
  username: string;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
}

const colors = [
  "#00f3ff", // cyan
  "#ff00ff", // magenta
  "#39ff14", // neon green
  "#ffed00", // neon yellow
  "#ff0055", // hot pink
  "#b026ff", // bright purple
  "#00ff9f", // spring green
  "#ff5e00", // neon orange
];

const AvatarDock = ({ provider, currentUser }: { provider: any, currentUser: string }) => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.filter((s: any) => s.user));
    };
    provider.awareness.on("change", updateUsers);
    updateUsers();
    return () => provider.awareness.off("change", updateUsers);
  }, [provider]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full flex gap-4 items-center z-50">
      {users.map((state, i) => (
        <div key={i} className="relative group cursor-pointer">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-transform hover:scale-110 ${state.user.name === currentUser ? 'ring-2 ring-white/50' : ''}`}
            style={{ backgroundColor: state.user.color, boxShadow: `0 0 15px ${state.user.color}` }}
          >
            {state.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            {state.user.name}
          </div>
        </div>
      ))}
    </div>
  );
};

const SnapshotTracker = ({ setSnapshots }: { setSnapshots: any }) => {
  const { helpers } = useRemirrorContext();
  
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const json = helpers.getJSON();
        setSnapshots((prev: any) => {
          const last = prev[prev.length - 1];
          if (!last || JSON.stringify(last.json) !== JSON.stringify(json)) {
            return [...prev, { time: Date.now(), json }];
          }
          return prev;
        });
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [helpers, setSnapshots]);

  return null;
};

const PlaybackUpdater = ({ json }: { json: any }) => {
  const { setContent } = useRemirrorContext();
  useEffect(() => {
    try { setContent(json); } catch (e) {}
  }, [json, setContent]);
  return null;
};

const PlaybackViewer = ({ json }: { json: any }) => {
  const { manager, state } = useRemirror({
    extensions: () => [
      new BoldExtension(),
      new ItalicExtension(),
      new UnderlineExtension(),
      new HeadingExtension({ levels: [1, 2, 3] }),
      new FontSizeExtension({ defaultSize: "16", unit: "px" }),
      new OrderedListExtension(),
      new ListItemExtension(),
      new BulletListExtension({ enableSpine: true }),
      new CalloutExtension({ defaultType: "warn" }),
      new CodeBlockExtension(),
      new CodeExtension(),
      new LinkExtension({ autoLink: true }),
    ],
    selection: "start",
  });

  return (
    <Remirror
      manager={manager}
      initialContent={state}
      editable={false}
      classNames={[
        "p-8 focus:outline-none h-full overflow-y-auto scrollbar-hide prose prose-invert lg:prose-xl prose-p:m-0 w-full max-w-none text-gray-200 prose-headings:text-white prose-a:text-cyan-400 prose-code:text-purple-300 opacity-75 grayscale-[50%]",
      ]}
    >
      <div className="h-full w-full pointer-events-none">
        <PlaybackUpdater json={json} />
        <EditorComponent />
      </div>
    </Remirror>
  );
};

const Editor: React.FC<Props> = (props) => {
  const { username, ydoc, provider } = props;

  // remirror error handler
  const onError: InvalidContentHandler = useCallback(
    ({ json, invalidContent, transformers }: any) => {
      // Automatically remove all invalid nodes and marks.
      return transformers.remove(json, invalidContent);
    },
    []
  );

  // set user and cleanup on unmount
  useEffect(() => {
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: colors[randomInt(0, colors.length - 1)],
    });

    const cleanup = () => {
      provider.awareness.setLocalState(null);
    };
    
    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, [username, provider]);

  // Power mode effect
  useEffect(() => {
    const handleInput = (e: Event) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width > 0 || rect.height > 0 || (rect.left > 0 && rect.top > 0)) {
        const myColor = provider.awareness.getLocalState()?.user?.color || "#00f3ff";
        spawnParticles(rect.right || rect.left, rect.top + rect.height / 2, myColor);
      }
    };
    
    // Listen to input events on the editor container to capture typing
    document.addEventListener("input", handleInput);
    return () => document.removeEventListener("input", handleInput);
  }, [provider]);

  // TODO: reset form when room changes
  const { manager, state, onChange } = useRemirror({
    extensions: () => [
      new BoldExtension(),
      new ItalicExtension(),
      new UnderlineExtension(),
      new HeadingExtension({ levels: [1, 2, 3] }),
      new FontSizeExtension({ defaultSize: "16", unit: "px" }),
      new OrderedListExtension(),
      new ListItemExtension(),
      new BulletListExtension({ enableSpine: true }),
      new CalloutExtension({ defaultType: "warn" }),
      new CodeBlockExtension(),
      new CodeExtension(),
      new HistoryExtension(),
      new LinkExtension({ autoLink: true }),
      new CollaborationExtension({
        clientID: username,
      }),
      new YjsExtension({
        getProvider: () => provider,
      }),
    ],
    selection: "start",
    onError,
  });

  const [snapshots, setSnapshots] = useState<{time: number, json: any}[]>([]);
  const [scrubIndex, setScrubIndex] = useState<number>(-1);
  const isScrubbing = scrubIndex >= 0 && scrubIndex < snapshots.length - 1;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className={`absolute inset-0 flex flex-col ${isScrubbing ? 'opacity-0 pointer-events-none' : 'block'}`}>
        <Remirror
          manager={manager}
          initialContent={state}
          placeholder="Start typing..."
          classNames={[
            "p-8 focus:outline-none h-full overflow-y-auto scrollbar-hide prose prose-invert lg:prose-xl prose-p:m-0 w-full max-w-none text-gray-200 prose-headings:text-white prose-a:text-cyan-400 prose-code:text-purple-300",
          ]}
        >
          <div className="h-full w-full">
            <SnapshotTracker setSnapshots={setSnapshots} />
            <EditorComponent />
            <OnChangeJSON onChange={onChange as any} />
          </div>
        </Remirror>
      </div>



      <AvatarDock provider={provider} currentUser={username} />
    </div>
  );
};

export default Editor;
