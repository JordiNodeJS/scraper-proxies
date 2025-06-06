#!/bin/bash

echo "🚀 Deploying Scraper Proxies..."

# Build everything
echo "🏗️ Building project..."
./scripts/build.sh

# Deploy frontend to Netlify/Vercel
echo "🌐 Deploying frontend..."
cd apps/frontend
if command -v netlify &> /dev/null; then
  netlify deploy --prod --dir=dist
elif command -v vercel &> /dev/null; then
  vercel --prod
else
  echo "❌ No deployment tool found (netlify or vercel)"
fi

# Deploy backend to Railway/Render
echo "⚡ Deploying backend..."
cd ../backend
if command -v railway &> /dev/null; then
  railway up
elif command -v render &> /dev/null; then
  render deploy
else
  echo "❌ No backend deployment tool found (railway or render)"
fi

echo "✅ Deployment complete!" 