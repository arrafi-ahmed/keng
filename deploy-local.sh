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
REMOTE_DIR="~"  # This ensures upload goes to the actual SSH user's home

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
scp \
  deploy-remote.sh \
  frontend/.env.production "$SERVER:$REMOTE_DIR/.env.frontend.production" \
  backend/.env.production "$SERVER:$REMOTE_DIR/.env.backend.production"

# === 3. Trigger deploy ===
echo "🚀 Running remote deploy script..."
ssh "$SERVER" "cd $REMOTE_DIR && chmod +x deploy-remote.sh && ./deploy-remote.sh"
