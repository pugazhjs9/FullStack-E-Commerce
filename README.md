# ShopSmart — E-Commerce Application

A modern, production-ready fullstack e-commerce application built with **React 18** and **Node.js/Express**, using JSON file-based storage. Features a complete CI/CD pipeline, automated testing suite, Docker support, and EC2 deployment automation.

## 🚀 Live Demo & Deployments

| Environment       | Platform        | URL                              |
| ----------------- | --------------- | -------------------------------- |
| Frontend (Static) | GitHub Pages    | Auto-deployed on merge to `main` |
| Full Stack        | Render.com      | Configured via `render.yaml`     |
| Self-hosted       | AWS EC2 + Nginx | Automated via GitHub Actions     |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Browser                               │
│                     (React 18 + Vite SPA)                           │
└─────────────────────┬───────────────────────────────────────────────┘
                      │  HTTP/HTTPS (REST API calls)
                      │  VITE_API_URL → /api/*
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Express.js Backend                              │
│                     Node.js + CORS + JSON                           │
│                                                                     │
│   /api/health       /api/products     /api/auth                     │
│   /api/cart         /api/orders                                     │
│                                                                     │
│         ┌───────────────────────────────────┐                       │
│         │    JSON File-based Storage        │                       │
│         │  users.json   carts.json          │                       │
│         │  products.json  orders.json       │                       │
│         └───────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow (Shopping Cart Example)

```
User clicks "Add to Cart"
  → ProductDetail.jsx calls cartApi.add(productId, quantity)
    → api.js fetchApi('/api/cart', { method: 'POST', ... })
      → Express cartRoutes.js reads auth token
        → reads carts.json, appends item
          → writes updated carts.json
            → returns updated cart to client
              → CartContext refreshCart() updates global state
                → Navbar cart badge re-renders with new count
```

### Frontend Architecture

```
client/src/
├── components/            # Shared UI components
│   ├── Navbar.jsx         # Top nav with cart count badge
│   ├── Footer.jsx         # Site footer
│   ├── ProductCard.jsx    # Product listing card
│   ├── CartItem.jsx       # Cart line item
│   ├── ProtectedRoute.jsx # Auth guard — redirects to /login
│   └── ErrorBoundary.jsx  # Catch-all error UI
├── context/               # Global state (React Context API)
│   ├── AuthContext.jsx    # User session + login/logout/register
│   └── CartContext.jsx    # Cart state + CRUD operations
├── pages/                 # Page-level components
│   ├── Home.jsx           # Landing page + featured products
│   ├── Products.jsx       # Browse + filter + search
│   ├── ProductDetail.jsx  # Single product + add to cart
│   ├── Cart.jsx           # Cart review
│   ├── Checkout.jsx       # Shipping form + place order
│   ├── Orders.jsx         # Order history
│   ├── Login.jsx          # Login form
│   └── Register.jsx       # Registration form
└── services/
    └── api.js             # Centralised fetch wrapper + all API calls
```

---

## 🛠️ Tech Stack

| Layer             | Technology                         | Purpose                                       |
| ----------------- | ---------------------------------- | --------------------------------------------- |
| Frontend          | React 18, React Router v7          | SPA with client-side routing                  |
| Build Tool        | Vite 5                             | Dev server + optimized production bundles     |
| Styling           | Custom CSS (36KB) + Tailwind CSS 4 | Dark theme, glassmorphism, animations         |
| Backend           | Node.js 20, Express.js 4           | REST API server                               |
| Auth              | Simple token (`token_<id>_<ts>`)   | Session management without library dependency |
| Storage           | JSON flat files                    | Zero-setup data persistence                   |
| Unit Tests        | Vitest (client), Jest (server)     | Component and route testing                   |
| Integration Tests | Supertest + Jest                   | Real HTTP + real file I/O                     |
| E2E Tests         | Playwright                         | Full browser user flow tests                  |
| CI/CD             | GitHub Actions                     | Auto test + lint + deploy on push             |
| Containers        | Docker + Docker Compose            | Reproducible local and production environment |
| Deployment        | AWS EC2 + Nginx + PM2              | Production self-hosting                       |

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ (`node --version`)
- npm 8+ (`npm --version`)
- Docker + Docker Compose (optional, for containerised setup)

---

### ⚡ Quick Start (Recommended)

```bash
# 1. Clone
git clone https://github.com/<your-username>/FullStack-E-Commerce.git
cd FullStack-E-Commerce

# 2. Setup env files
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 3. Run everything
chmod +x run.sh && ./run.sh
```

App runs at: **http://localhost:5173** (Backend: http://localhost:5001)

---

### 🐳 Docker Setup

```bash
# Build and start both services
docker compose up --build

# Access
# Frontend: http://localhost
# Backend:  http://localhost:5001/api/health

# Stop
docker compose down

# Persistent data is saved in a Docker volume (server-data)
```

---

### 🔧 Manual Setup

```bash
# Install all dependencies
npm install            # root (playwright runner)
cd server && npm install
cd ../client && npm install

# Start backend (Terminal 1)
cd server && npm run dev        # http://localhost:5001

# Start frontend (Terminal 2)
cd client && npm run dev        # http://localhost:5173
```

---

### Demo Account

| Field    | Value                |
| -------- | -------------------- |
| Email    | `demo@shopsmart.com` |
| Password | `demo123`            |

---

## 🧪 Testing Strategy

The project uses a three-layer testing approach:

```
E2E Tests (Playwright)
  └── Full browser flows: auth, cart, checkout, products
      Tests from the user's perspective, hitting the real running app

Integration Tests (Jest + Supertest)
  └── Real Express app + real JSON file I/O
      Covers: auth, cart, orders, products routes
      Tests API contract and data persistence

Unit Tests (Vitest + Jest)
  └── Isolated component/function tests with mocks
      Client: components, contexts, API service
      Server: route handlers with mocked dataUtils
```

### Running Tests

```bash
# ─── Server ───────────────────────────────────────────────────────
cd server

# All server tests
npm test

# Unit only
npm run test:unit

# Integration only (runs sequentially to avoid file conflicts)
npm run test:integration

# With coverage report
npm run test:coverage

# ─── Client ───────────────────────────────────────────────────────
cd client

# All client tests (Vitest)
npm test

# Watch mode
npm run test:watch

# ─── E2E (from project root) ──────────────────────────────────────
# Ensure both dev servers are running first, then:
npm run test:e2e

# View HTML report
npm run test:e2e:report

# ─── All at once ──────────────────────────────────────────────────
npm run test:all
```

---

## ⚙️ CI/CD Pipeline

### Workflows Overview

| Workflow                | Trigger                  | Purpose                                                              |
| ----------------------- | ------------------------ | -------------------------------------------------------------------- |
| `frontend-tests.yml`    | push + PR to main        | Lint → Format → Vitest → Playwright → Build                          |
| `integration.yml`       | push + PR to main        | Node 18/20/22 matrix: lint, test, build; Slack notify                |
| `ci.yml`                | push + PR (all branches) | Full CI: client + server build, test, format                         |
| `deploy.yml`            | push to main             | SSH → EC2: git pull, npm ci, PM2 restart, Nginx reload, health check |
| `gh-pages.yml`          | push to main             | Build Vite → deploy to GitHub Pages                                  |
| `server_matrix.yml`     | manual                   | Node version compatibility check                                     |
| `variables_secrets.yml` | manual                   | Demo: env variables and artifact management                          |
| `recap.yml`             | manual                   | Demo: basic workflow concepts                                        |

### CI/CD Flow Diagram

```
Developer pushes to any branch
         │
         ▼
  ┌──────────────────┐
  │   ci.yml starts  │  ← Runs on EVERY push/PR
  │  • Install deps  │
  │  • ESLint        │
  │  • Prettier      │
  │  • Tests         │
  │  • Build         │
  └──────────────────┘
         │
         │  (if branch = main)
         ▼
  ┌──────────────────────────────────────────────┐
  │         frontend-tests.yml                   │
  │  • Vitest unit + integration tests           │
  │  • Playwright E2E on Chromium                │
  │  • Upload HTML report as artifact            │
  └──────────────────────────────────────────────┘
         │
  ┌──────────────────────────────────────────────┐
  │         integration.yml                      │
  │  • Node 18 / 20 / 22 matrix                  │
  │  • Full lint + test + build                  │
  │  • Slack notification (pass/fail)            │
  └──────────────────────────────────────────────┘
         │
  ┌──────────────────────────────────────────────┐
  │         deploy.yml (auto on main push)       │
  │  • SSH into EC2                              │
  │  • git pull origin main                      │
  │  • npm ci + PM2 restart backend              │
  │  • npm run build + rsync frontend            │
  │  • nginx reload                              │
  │  • curl /api/health (must return 200)        │
  └──────────────────────────────────────────────┘
```

### GitHub Secrets Required for Deployment

| Secret              | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `EC2_SSH_KEY`       | Private key content of the EC2 key pair (`.pem` file content) |
| `EC2_USER`          | EC2 SSH username (e.g., `ec2-user` for Amazon Linux)          |
| `EC2_HOST`          | EC2 public IP or domain                                       |
| `SLACK_WEBHOOK_URL` | Slack webhook URL for CI notifications                        |

---

## 📡 API Reference

### Authentication

| Method | Endpoint             | Auth | Description           |
| ------ | -------------------- | ---- | --------------------- |
| POST   | `/api/auth/register` | —    | Register new user     |
| POST   | `/api/auth/login`    | —    | Login → returns token |
| GET    | `/api/auth/me`       | ✅   | Get current user      |

### Products

| Method | Endpoint                   | Auth | Description                                                 |
| ------ | -------------------------- | ---- | ----------------------------------------------------------- |
| GET    | `/api/products`            | —    | List products (supports `?category=`, `?search=`, `?sort=`) |
| GET    | `/api/products/:id`        | —    | Get single product                                          |
| GET    | `/api/products/categories` | —    | List all categories                                         |
| POST   | `/api/products`            | —    | Create product                                              |
| PUT    | `/api/products/:id`        | —    | Update product                                              |
| DELETE | `/api/products/:id`        | —    | Delete product                                              |

### Cart

| Method | Endpoint               | Auth | Description                          |
| ------ | ---------------------- | ---- | ------------------------------------ |
| GET    | `/api/cart`            | ✅   | Get user's cart                      |
| POST   | `/api/cart`            | ✅   | Add item (`{ productId, quantity }`) |
| PUT    | `/api/cart/:productId` | ✅   | Update quantity                      |
| DELETE | `/api/cart/:productId` | ✅   | Remove item                          |
| DELETE | `/api/cart`            | ✅   | Clear cart                           |

### Orders

| Method | Endpoint          | Auth | Description            |
| ------ | ----------------- | ---- | ---------------------- |
| GET    | `/api/orders`     | ✅   | Get user's orders      |
| GET    | `/api/orders/:id` | ✅   | Get single order       |
| POST   | `/api/orders`     | ✅   | Create order from cart |

### Health

| Method | Endpoint      | Description                           |
| ------ | ------------- | ------------------------------------- |
| GET    | `/api/health` | Returns `{ status: "ok", timestamp }` |

---

## ☁️ AWS EC2 Deployment

### EC2 Scripts (`scripts/`)

| Script                | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `launch_ec2.sh`       | Idempotent instance launcher — skips existing resources    |
| `safe_ec2_control.sh` | State-aware start/stop — no-ops on already-running/stopped |
| `ec2_health_check.sh` | Polls public IP until app is responding                    |
| `ec2_control.sh`      | Simple start/stop wrapper                                  |

### Initial EC2 Server Setup (one-time)

```bash
# 1. Launch instance (idempotent — safe to re-run)
chmod +x scripts/launch_ec2.sh
./scripts/launch_ec2.sh

# 2. SSH into the instance
ssh -i vockey.pem ec2-user@<PUBLIC_IP>

# 3. On EC2: install dependencies
sudo dnf update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git nginx
npm install -g pm2

# 4. Clone and configure
git clone https://github.com/<your-username>/FullStack-E-Commerce.git ~/shopsmart
cd ~/shopsmart/server && cp .env.example .env
# Edit .env with production values
nano .env

# 5. Start the backend
cd ~/shopsmart/server
npm ci --omit=dev
pm2 start src/index.js --name shopsmart-backend
pm2 save && pm2 startup

# 6. Build frontend
cd ~/shopsmart/client
npm ci && npm run build
sudo mkdir -p /var/www/shopsmart/client
sudo cp -r dist /var/www/shopsmart/client/

# 7. Configure Nginx (copy nginx.conf contents)
sudo nano /etc/nginx/conf.d/shopsmart.conf
sudo systemctl enable nginx && sudo systemctl start nginx
```

After this initial setup, subsequent deploys happen **automatically** via `deploy.yml` on every push to `main`.

---

## 🧹 Code Quality

```bash
# ─── Client ───
cd client
npm run lint          # ESLint (react, react-hooks, react-refresh plugins)
npm run format:check  # Prettier check
npm run format        # Prettier auto-fix

# ─── Server ───
cd server
npm run lint          # ESLint (eslint:recommended, Node env)
npm run format:check  # Prettier check
npm run format        # Prettier auto-fix
```

Both lint and format checks **fail CI** — there is no `|| true` silencing.

---

## 🐛 Known Limitations & Design Decisions

### Why JSON Files Instead of a Database?

JSON files were chosen for **zero-setup portability**. Every evaluator, contributor, or new developer can clone and run `./run.sh` — no database install, no connection string, no Docker needed just to start. The trade-off is that concurrent writes from multiple server processes are not safe.

### Authentication Tokens

A simple `token_<id>_<timestamp>` format is used instead of JWT to avoid any cryptography library dependency. This means tokens never expire. **For production**, replace with `jsonwebtoken` and `bcrypt`.

### Passwords Stored in Plain Text

⚠️ The current implementation stores passwords as plain text in `users.json`. This is intentional for project-scope simplicity. **Before any real deployment**, add bcrypt:

```bash
cd server && npm install bcrypt
```

Then hash in `authRoutes.js` at registration and compare at login.

---

## 🔒 Security Features Implemented

| Feature                | Implementation                                                  |
| ---------------------- | --------------------------------------------------------------- |
| CORS allowlist         | `ALLOWED_ORIGINS` env var — no wildcard `*`                     |
| Auth middleware        | Token required on all cart/order endpoints                      |
| Nginx security headers | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` |
| Non-root Docker user   | Server container runs as `nodeuser` (UID 1001)                  |
| npm ci in CI           | Uses lockfile — reproducible, no supply-chain drift             |

---

## 🎨 Design Features

- **Dark Theme** — Modern dark UI with deep charcoal backgrounds
- **Glassmorphism** — Subtle backdrop-blur effects on cards and modals
- **Smooth Animations** — CSS transitions on hover, cart add, and page changes
- **Mobile-first** — Responsive grid layout that collapses cleanly on small screens
- **Premium Typography** — Google Fonts Inter + Outfit

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.
