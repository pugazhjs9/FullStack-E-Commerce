# =============================================================================
# Server Dockerfile — Multi-stage Node 20 Alpine
# =============================================================================

# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production Image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source (exclude test files)
COPY src/ ./src/
COPY package.json ./

# Create data directory with correct ownership
RUN mkdir -p ./src/data && chown -R nodeuser:nodejs /app

USER nodeuser

# Runtime config
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

# Health check (requires curl — already in alpine base)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5001/api/health || exit 1

CMD ["node", "src/index.js"]
