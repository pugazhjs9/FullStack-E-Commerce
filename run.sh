#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "   FullStack E-Commerce Setup & Run      "
echo "========================================="

echo -e "\n📦 [1/3] Installing root dependencies..."
npm install

echo -e "\n📦 [2/3] Installing server dependencies..."
cd server
npm install
cd ..

echo -e "\n📦 [3/3] Installing client dependencies..."
cd client
npm install
cd ..

echo -e "\n🚀 Setup complete! Starting the application..."
echo "========================================="

# Run both client and server concurrently using npx
npx --yes concurrently \
  -c "bgBlue.bold,bgMagenta.bold" \
  -n "SERVER,CLIENT" \
  "npm run dev:server" \
  "npm run dev:client"
