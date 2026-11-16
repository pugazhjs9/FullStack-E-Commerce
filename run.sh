#!/usr/bin/env bash
# =============================================================================
# One-command local setup for ShopSmart.
#
#   git clone https://github.com/pugazhjs9/FullStack-E-Commerce.git
#   cd FullStack-E-Commerce && ./run.sh
#
# Installs dependencies, creates .env files, starts the Express API (:5001)
# and the Vite client (:5173), then opens the app in your browser.
# Press Ctrl+C to stop both servers.
# =============================================================================

set -euo pipefail

cd "$(dirname "$0")"

SERVER_PORT=5001
CLIENT_PORT=5173

log()   { printf '\033[1;34m[run]\033[0m %s\n' "$1"; }
error() { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; exit 1; }

# ─── 1. Prerequisites ────────────────────────────────────────────────────────
log "Checking prerequisites..."
command -v node >/dev/null 2>&1 || error "Node.js is not installed. Get Node 22 LTS from https://nodejs.org"
command -v npm  >/dev/null 2>&1 || error "npm is not installed."
command -v curl >/dev/null 2>&1 || error "curl is not installed."

# Vite 8 requires Node ^20.19.0 || >=22.12.0
node -e '
  const [major, minor] = process.versions.node.split(".").map(Number);
  process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22 ? 0 : 1);
' || error "Node $(node -v) is too old. Vite 8 needs Node 20.19+ or 22.12+ (e.g. 'nvm install 22')."

if command -v lsof >/dev/null 2>&1; then
  for port in "$SERVER_PORT" "$CLIENT_PORT"; do
    if lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      error "Port $port is already in use. Stop whatever is running on it and retry."
    fi
  done
fi
log "Node $(node -v), npm $(npm -v)"

# ─── 2. Dependencies ─────────────────────────────────────────────────────────
# npm ci installs exactly what the lockfiles pin and never rewrites them
log "Installing server dependencies..."
(cd server && npm ci --no-audit --no-fund)

log "Installing client dependencies..."
(cd client && npm ci --no-audit --no-fund)

# ─── 3. Environment files ────────────────────────────────────────────────────
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  log "Created server/.env"
fi
if [ ! -f client/.env.local ]; then
  cp client/.env.example client/.env.local
  log "Created client/.env.local"
fi

# ─── 4. Start servers ────────────────────────────────────────────────────────
SERVER_PID=""
CLIENT_PID=""

cleanup() {
  trap - EXIT INT TERM
  echo
  log "Stopping servers..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' INT TERM

log "Starting API server on http://localhost:$SERVER_PORT ..."
(cd server && PORT="$SERVER_PORT" exec node_modules/.bin/nodemon src/index.js) &
SERVER_PID=$!

for i in $(seq 1 30); do
  curl -fs -o /dev/null "http://localhost:$SERVER_PORT/api/health" && break
  kill -0 "$SERVER_PID" 2>/dev/null || error "API server exited during startup (see logs above)."
  [ "$i" -eq 30 ] && error "API server did not respond on :$SERVER_PORT within 30s (see logs above)."
  sleep 1
done
log "API is up."

# --open makes Vite launch the default browser once it is listening
log "Starting client on http://localhost:$CLIENT_PORT and opening the browser..."
(cd client && exec node_modules/.bin/vite --port "$CLIENT_PORT" --strictPort --open) &
CLIENT_PID=$!

# Keep running until Ctrl+C, or until either server dies
while kill -0 "$SERVER_PID" 2>/dev/null && kill -0 "$CLIENT_PID" 2>/dev/null; do
  sleep 1
done
error "A server stopped unexpectedly (see logs above)."
