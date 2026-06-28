# 🌐 SyncDraft

> A real-time collaborative writing environment with branch-based drafting, powered by CRDTs.

![SyncDraft](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Django](https://img.shields.io/badge/Django-4.1-092E20?logo=django) ![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-blue) ![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange)

## ✨ Overview

SyncDraft is a real-time collaborative text editor that allows multiple users to write and edit documents simultaneously — like Google Docs, but with **Git-style branching**. Users can create isolated "drafts" (branches) from the main document, collaborate within them in real-time, and merge changes back when ready.

### 🔑 Key Features

- **Real-Time Collaboration** — Multiple users can edit the same document simultaneously with live cursor tracking and instant sync powered by Yjs CRDTs.
- **Branch-Based Drafting** — Create isolated drafts branched from the main document. Experiment freely without affecting the main content.
- **Password-Protected Drafts** — Lock your drafts with a password. Only users who know the password can join and collaborate.
- **Join Draft** — Any user can join an existing draft by entering its name and password (if required), enabling seamless cross-device collaboration.
- **Merge to Main** — When a draft is ready, merge it back into the main document with a single click.
- **Power Mode Typing Effects** — Dynamic particle animations and screen shake effects while typing for an engaging editing experience.
- **Session Persistence** — Your session is saved in localStorage, so refreshing the page won't log you out.
- **Dark Glassmorphism UI** — A premium, modern interface with glass-panel effects, gradient accents, and smooth micro-animations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                    │
│  React 18 + TypeScript + Vite + Remirror + Yjs          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Login   │  │  Editor  │  │  Branch Management   │   │
│  │  Screen  │  │  (CRDT)  │  │  (Create/Join/Merge) │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ WebSocket (wss://) + REST API
┌─────────────────────▼───────────────────────────────────┐
│                    Backend (Railway)                     │
│  Django 4.1 + Channels + Daphne (ASGI)                  │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  WebSocket   │  │  Branch   │  │  Password Auth   │  │
│  │  Consumer    │  │  REST API │  │  (SHA256 hashed)  │  │
│  └──────┬───────┘  └───────────┘  └──────────────────┘  │
│         │                                                │
│  ┌──────▼───────┐  ┌────────────┐                       │
│  │    Redis     │  │  SQLite    │                       │
│  │ Channel Layer│  │  Database  │                       │
│  └──────────────┘  └────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

| Layer      | Technology                                      |
|------------|------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, TailwindCSS         |
| Editor     | Remirror (ProseMirror), Yjs (CRDT)              |
| Realtime   | y-websocket, Django Channels, WebSockets        |
| Backend    | Django 4.1, Daphne (ASGI), Django REST          |
| Database   | SQLite (branches metadata)                      |
| Cache      | Redis (channel layer for WebSocket relay)        |
| Deployment | Vercel (frontend), Railway (backend + Redis)     |

---

## 📦 Project Structure

```
SyncDraft/
├── app/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx               # Main app with routing, branch management
│   │   ├── components/
│   │   │   └── editor/
│   │   │       └── index.tsx     # Remirror editor with Yjs integration
│   │   ├── hooks/
│   │   │   └── useYjs.ts         # Custom hook for Yjs document binding
│   │   ├── utils/
│   │   │   └── powerMode.ts      # Typing particle effects engine
│   │   ├── index.css             # Global styles & glassmorphism theme
│   │   └── main.tsx              # App entry point
│   ├── .env.production           # Production API/WS endpoints
│   ├── package.json
│   └── vite.config.ts
│
├── app-server/                   # Backend (Django + Channels)
│   ├── core/
│   │   ├── settings.py           # Django settings, CORS, Redis config
│   │   ├── asgi.py               # ASGI application with WebSocket routing
│   │   └── urls.py               # URL configuration
│   ├── editor/
│   │   ├── models.py             # Branch model with password hashing
│   │   ├── views.py              # REST API (create, verify, list branches)
│   │   ├── urls.py               # API URL patterns
│   │   └── socket/
│   │       ├── consumers.py      # WebSocket consumer (auth + relay)
│   │       └── routing.py        # WebSocket URL routing
│   ├── requirements.txt
│   ├── Procfile                  # Railway start command
│   └── nixpacks.toml             # Railway build config
│
└── README.md
```

---

## 🛠️ Local Development

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- Redis (optional, falls back to in-memory for local dev)

### Frontend Setup

```bash
cd app
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend Setup

```bash
cd app-server
python -m venv env
source env/bin/activate      # Windows: env\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=your-secret-key" > .env
echo "DEBUG=True" >> .env

python manage.py migrate
python manage.py runserver
# Runs on http://localhost:8000
```

---

## 🌍 Deployment

### Frontend → Vercel

The frontend is deployed on [Vercel](https://vercel.com) with production environment variables:

| Variable       | Value                                                    |
|---------------|----------------------------------------------------------|
| `VITE_API_URL` | `https://nexus-workspace-backend-production.up.railway.app` |
| `VITE_WS_URL`  | `wss://nexus-workspace-backend-production.up.railway.app/ws/editor/` |

### Backend → Railway

The backend runs on [Railway](https://railway.app) with:

- **Daphne** ASGI server for HTTP + WebSocket support
- **Redis** for cross-connection message relay (channel layer)
- **SQLite** for branch metadata storage

---

## 🧪 How It Works

### Collaborative Editing (CRDTs)

SyncDraft uses [Yjs](https://yjs.dev), a CRDT (Conflict-free Replicated Data Type) library, to enable real-time collaboration without conflicts. Each user's edits are encoded as Yjs updates and broadcast via WebSocket to all connected users in the same room.

### Branch System

1. **Create Draft** → Forks the current main document state into a new Yjs document, creates a WebSocket room, and registers it in the database.
2. **Join Draft** → Fetches the latest branch list from the server, verifies the password (if any), and connects to the branch's WebSocket room.
3. **Merge to Main** → Applies the branch's Yjs state as an update to the main document, syncing all changes instantly.

### Password Protection

Branch passwords are hashed with SHA-256 before storage. When a user attempts to join a protected branch, the password is verified server-side before the WebSocket connection is established.

---

## 👤 Author

**Anish R** — [GitHub](https://github.com/Anish-R-18)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
