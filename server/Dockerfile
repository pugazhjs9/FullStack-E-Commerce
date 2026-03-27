# =============================================================================
# Server Dockerfile — Development (Node 20 Bookworm Slim)
# =============================================================================
FROM node:20-bookworm-slim

# Install openssl (required by Prisma on Debian) and wget (for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Copy and set permissions for entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 5001

# Healthcheck via the existing /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5001/api/health || exit 1

ENTRYPOINT ["entrypoint.sh"]
