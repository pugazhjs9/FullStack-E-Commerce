#!/bin/sh
set -e

echo "========================================="
echo "  Antigravity — Server Startup"
echo "========================================="

# ── Prisma setup (only if prisma directory exists) ──────────────────────────
if [ -d "prisma" ]; then
  echo "📦 Generating Prisma client..."
  npx prisma generate

  echo "🔄 Running Prisma migrations..."
  npx prisma migrate deploy

  # Seed database if seed script exists
  if [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database..."
    node prisma/seed.js || echo "⚠️  Seeding skipped (may already be seeded)"
  fi
else
  echo "ℹ️  No prisma/ directory found — skipping Prisma setup"
fi

echo ""
echo "🚀 Starting development server with nodemon..."
exec npx nodemon src/index.js
