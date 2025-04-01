#!/bin/bash
# Clean cache before deploying to Vercel

echo "Cleaning build cache..."
rm -rf .next/cache
rm -rf node_modules/.cache

echo "Resetting Vercel cache..."
npx vercel deploy --prod --no-build-cache 