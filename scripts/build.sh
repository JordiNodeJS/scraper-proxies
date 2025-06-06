#!/bin/bash

echo "🏗️ Building Scraper Proxies Monorepo..."

# Build packages first
echo "📦 Building packages..."
cd packages/shared && bun run build
cd ../proxy-scraper && bun run build
cd ../proxy-validator && bun run build

# Build applications
echo "🚀 Building applications..."
cd ../../apps/backend && bun run build
cd ../frontend && bun run build

echo "✅ Build complete!" 