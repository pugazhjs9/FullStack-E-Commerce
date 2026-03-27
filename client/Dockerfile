# =============================================================================
# Client Dockerfile — Development (Node 20 Bookworm Slim + Vite Dev Server)
# =============================================================================
FROM node:20-bookworm-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 5173

# Start Vite dev server bound to all interfaces for Docker access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
