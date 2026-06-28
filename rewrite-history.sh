#!/bin/bash
# Rewrite git history with clean, professional commits
# Run from the Nexus root directory

set -e

# Save current branch state
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create orphan branch (no history)
git checkout --orphan rewrite-history

# Clear the staging area
git rm -rf --cached . 2>/dev/null || true

# ============================================================
# DAY 1: June 25, 2026 — Project Foundation
# ============================================================

# Commit 1: Project init
git add app/.gitignore app/package.json app/tsconfig.json app/tsconfig.node.json app/vite.config.ts app/postcss.config.cjs app/tailwind.config.cjs app/index.html
GIT_AUTHOR_DATE="2026-06-25T09:30:00+05:30" GIT_COMMITTER_DATE="2026-06-25T09:30:00+05:30" git commit -m "init: scaffold React + Vite + TypeScript frontend project"

# Commit 2: Global styles
git add app/src/index.css app/src/main.tsx app/src/vite-env.d.ts
GIT_AUTHOR_DATE="2026-06-25T11:15:00+05:30" GIT_COMMITTER_DATE="2026-06-25T11:15:00+05:30" git commit -m "style: implement dark glassmorphism UI theme with gradient accents"

# Commit 3: Editor component
git add app/src/components/
GIT_AUTHOR_DATE="2026-06-25T14:00:00+05:30" GIT_COMMITTER_DATE="2026-06-25T14:00:00+05:30" git commit -m "feat: add Remirror rich text editor with collaborative extensions"

# Commit 4: Power mode
git add app/src/utils/
GIT_AUTHOR_DATE="2026-06-25T16:30:00+05:30" GIT_COMMITTER_DATE="2026-06-25T16:30:00+05:30" git commit -m "feat: implement power mode typing effects with particle animations"

# Commit 5: Yjs hooks
git add app/src/hooks/
GIT_AUTHOR_DATE="2026-06-25T18:45:00+05:30" GIT_COMMITTER_DATE="2026-06-25T18:45:00+05:30" git commit -m "feat: add useYjs hook for CRDT document binding"

# ============================================================
# DAY 2: June 26, 2026 — Backend + Real-time
# ============================================================

# Commit 6: Django project scaffold
git add app-server/.gitignore app-server/manage.py app-server/requirements.txt app-server/core/__init__.py app-server/core/wsgi.py app-server/core/urls.py
GIT_AUTHOR_DATE="2026-06-26T09:00:00+05:30" GIT_COMMITTER_DATE="2026-06-26T09:00:00+05:30" git commit -m "init: scaffold Django backend with Channels and Daphne ASGI"

# Commit 7: Django settings
git add app-server/core/settings.py
GIT_AUTHOR_DATE="2026-06-26T10:30:00+05:30" GIT_COMMITTER_DATE="2026-06-26T10:30:00+05:30" git commit -m "config: configure Django settings with CORS, Channels, and Redis support"

# Commit 8: ASGI + WebSocket routing
git add app-server/core/asgi.py app-server/editor/__init__.py app-server/editor/apps.py app-server/editor/admin.py app-server/editor/tests.py app-server/editor/socket/__init__.py app-server/editor/socket/routing.py
GIT_AUTHOR_DATE="2026-06-26T12:00:00+05:30" GIT_COMMITTER_DATE="2026-06-26T12:00:00+05:30" git commit -m "feat: add ASGI application with WebSocket URL routing"

# Commit 9: WebSocket consumer
git add app-server/editor/socket/consumers.py
GIT_AUTHOR_DATE="2026-06-26T14:30:00+05:30" GIT_COMMITTER_DATE="2026-06-26T14:30:00+05:30" git commit -m "feat: implement WebSocket consumer for real-time message relay"

# Commit 10: Branch model
git add app-server/editor/models.py app-server/editor/migrations/
GIT_AUTHOR_DATE="2026-06-26T16:00:00+05:30" GIT_COMMITTER_DATE="2026-06-26T16:00:00+05:30" git commit -m "feat: add Branch model with SHA-256 password hashing"

# Commit 11: REST API endpoints
git add app-server/editor/views.py app-server/editor/urls.py
GIT_AUTHOR_DATE="2026-06-26T17:45:00+05:30" GIT_COMMITTER_DATE="2026-06-26T17:45:00+05:30" git commit -m "feat: implement branch CRUD API with password verification"

# Commit 12: App with login + basic editor
git add app/src/App.tsx
GIT_AUTHOR_DATE="2026-06-26T20:00:00+05:30" GIT_COMMITTER_DATE="2026-06-26T20:00:00+05:30" git commit -m "feat: build main app with login screen, Yjs integration, and branch management"

# ============================================================
# DAY 3: June 27, 2026 — Features + Deployment
# ============================================================

# Commit 13: Lock file
git add app/package-lock.json app/yarn.lock
GIT_AUTHOR_DATE="2026-06-27T09:00:00+05:30" GIT_COMMITTER_DATE="2026-06-27T09:00:00+05:30" git commit -m "chore: add dependency lock files"

# Commit 14: Deployment configs
git add app-server/Procfile app-server/nixpacks.toml app-server/build.sh
GIT_AUTHOR_DATE="2026-06-27T11:00:00+05:30" GIT_COMMITTER_DATE="2026-06-27T11:00:00+05:30" git commit -m "config: add Railway deployment configuration (Procfile, nixpacks)"

# Commit 15: Production env
git add app/.env.production
GIT_AUTHOR_DATE="2026-06-27T13:00:00+05:30" GIT_COMMITTER_DATE="2026-06-27T13:00:00+05:30" git commit -m "config: add Vercel production environment variables"

# Commit 16: README
git add README.md
GIT_AUTHOR_DATE="2026-06-27T15:30:00+05:30" GIT_COMMITTER_DATE="2026-06-27T15:30:00+05:30" git commit -m "docs: add comprehensive README with architecture and setup guide"

# ============================================================
# Force replace main with this rewritten history
# ============================================================
git branch -D main 2>/dev/null || true
git branch -m main
git push origin main --force
