# ─── Stage 1: Install production dependencies only ───────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Lean production runtime ────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Install wget for healthcheck; clean up cache immediately
RUN apk add --no-cache wget

# Create non-root user before copying files
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Pull in production deps and application source from prior stages
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Hand ownership to the non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5001/api/health || exit 1

CMD ["node", "src/index.js"]
