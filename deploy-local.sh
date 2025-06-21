#!/bin/bash

SKIP_GIT=false

# === Parse Flags ===
for arg in "$@"; do
  case $arg in
    --skip-git)
      SKIP_GIT=true
      shift
      ;;
  esac
done

ENV_FILE="./backend/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing backend/.env.production"
  exit 1
fi

echo "🔑 Loading $ENV_FILE..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

: "${SITE_USER:?Missing SITE_USER}"
: "${SERVER_IP:?Missing SERVER_IP}"

SERVER="root@$SERVER_IP"
REMOTE_DIR="/root"  # This ensures upload goes to the actual SSH user's home

# === 1. Git Push (optional) ===
if [ "$SKIP_GIT" = false ]; then
  echo "📤 Pushing latest code to GitHub..."
  git add .
  git commit -m "📦 Deploy commit"
  git push origin main
else
  echo "🚫 Skipping git push"
fi

# === 2. Upload deploy files ===
echo "📦 Uploading deploy script and env files..."

# Use separate scp commands for each file if renaming,
# or copy them all to the directory if keeping original names.
# I'm assuming you want to rename them as you had in your original scp.
scp deploy-remote.sh "$SERVER:$REMOTE_DIR/deploy-remote.sh"
scp frontend/.env.production "$SERVER:$REMOTE_DIR/.env.frontend.production"
scp backend/.env.production "$SERVER:$REMOTE_DIR/.env.backend.production"

# === 3. Trigger deploy ===
echo "🚀 Running remote deploy script..."
ssh "$SERVER" "cd $REMOTE_DIR && chmod +x deploy-remote.sh && ./deploy-remote.sh"