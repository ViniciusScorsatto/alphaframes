#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f "package.json" ]; then
  echo "package.json not found. Run this script from the project folder."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Dependencies not found. Installing..."
  npm install
fi

echo "Starting Financial Video Studio..."
echo "Open http://localhost:3000 once the server is ready."

npm run dev
