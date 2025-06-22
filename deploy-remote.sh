#!/bin/bash

### === CONFIGURATION === ###
ENV_FILE=".env.production"

# Resolve actual home directory
HOME_DIR=$(eval echo ~$USER)

# Load environment variables from backend env if it exists (used for deploy vars)
if [ -f "$HOME_DIR/.env.backend.production" ]; then
  echo "🔑 Loading $HOME_DIR/.env.backend.production variables..."
  export $(grep -v '^#' "$HOME_DIR/.env.backend.production" | xargs)
else
  echo "❌ Missing backend env file at $HOME_DIR/.env.backend.production"
  exit 1
fi

# Require variables to be set
: "${PROJECT_NAME:?Missing PROJECT_NAME in env}"
: "${DOMAIN:?Missing DOMAIN in env}"
: "${PORT:?Missing PORT in env}"
: "${DB_NAME:?Missing DB_NAME in env}"
: "${DB_USER:?Missing DB_USER in env}"
: "${DB_PASS:?Missing DB_PASS in env}"
: "${SITE_USER:?Missing SITE_USER in env}"

SITE_DIR="/home/$SITE_USER/htdocs/$DOMAIN"
REPO_URL="https://github.com/arrafi-ahmed/$PROJECT_NAME.git"
CLONE_DIR="$SITE_DIR/tmp-deploy"
### ====================== ###

set -e

echo -e "\n🚀 Starting deployment for $PROJECT_NAME on $DOMAIN..."

# === 0. Install PostgreSQL (first-time only) ===
echo "🛠 Installing PostgreSQL (if not installed)..."
if ! command -v psql &> /dev/null; then
  apt update
  apt install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

# === 1. Clone fresh repo ===
echo "🔄 Cloning repo..."
rm -rf "$CLONE_DIR"
git clone "$REPO_URL" "$CLONE_DIR"

# === 1.1 Move env files to correct locations ===
echo "📁 Placing .env files into backend and frontend..."
cp "$HOME_DIR/.env.frontend.production" "$CLONE_DIR/frontend/.env.production"
cp "$HOME_DIR/.env.backend.production" "$CLONE_DIR/backend/.env.production"

# === 2. Build frontend ===
echo "🛠 Building frontend..."
cd "$CLONE_DIR/frontend"
npm install --legacy-peer-deps

# Debug: Check unplugin-auto-import exists (optional sanity check)
echo "DEBUG: Verifying unplugin-auto-import after npm install..."
if [ ! -d node_modules/unplugin-auto-import ]; then
  echo "DEBUG: unplugin-auto-import directory DOES NOT exist. This is problematic."
  ls -la node_modules/
  exit 1
fi

npm run build

rm -rf "$SITE_DIR/htdocs"
mkdir -p "$SITE_DIR/htdocs"
cp -r dist/* "$SITE_DIR/htdocs/"
echo "✅ Frontend deployed to $SITE_DIR/htdocs"

# === 3. Preserve /public/ folder if it exists ===
if [ -d "$SITE_DIR/backend/public" ] && [ "$(ls -A $SITE_DIR/backend/public 2>/dev/null)" ]; then
  echo "📦 Backing up existing public folder..."
  mv "$SITE_DIR/backend/public" "$SITE_DIR/public_backup"
fi

# === 4. Deploy backend ===
echo "📁 Syncing backend..."
rm -rf "$SITE_DIR/backend"
mkdir -p "$SITE_DIR/backend"
cp -r "$CLONE_DIR/backend/"* "$SITE_DIR/backend/"

# === 5. Restore /public/ if it was backed up ===
if [ -d "$SITE_DIR/public_backup" ]; then
  echo "♻️ Restoring public folder..."
  rm -rf "$SITE_DIR/backend/public"
  mv "$SITE_DIR/public_backup" "$SITE_DIR/backend/public"
fi

# === 6. Setup Node app ===
cd "$SITE_DIR/backend"
echo "📦 Installing backend dependencies..."
npm install --legacy-peer-deps

# === 7. Setup PM2 ecosystem config ===
echo "⚙️ Setting up PM2..."
cat <<EOF > ecosystem.config.js
module.exports = {
  apps: [{
    name: "$PROJECT_NAME-api",
    script: "app.js",
    instances: 1,
    autorestart: true,
    watch: false,
    env_production: {
      NODE_ENV: "production",
      PORT: "$PORT"
    }
  }]
};
EOF

sudo -u "$SITE_USER" pm2 start ecosystem.config.js --env production || sudo -u "$SITE_USER" pm2 restart "$PROJECT_NAME-api"
sudo -u "$SITE_USER" pm2 save

echo "🛠 Setting up PM2 daemon startup script for $SITE_USER..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$SITE_USER" --hp "/home/$SITE_USER"

# === 8. Setup Nginx reverse proxy ===
NGINX_CUSTOM_CONF="$SITE_DIR/nginx/custom.main.conf"
echo "🌐 Configuring Nginx reverse proxy..."
mkdir -p "$(dirname $NGINX_CUSTOM_CONF)"

cat <<EOF > "$NGINX_CUSTOM_CONF"
location /api/ {
    proxy_pass http://127.0.0.1:$PORT/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
}
EOF

nginx -t && systemctl reload nginx

# === 9. Setup PostgreSQL schema if exists ===
SCHEMA_SQL="$CLONE_DIR/backend/schema-pg.sql"
if [ -f "$SCHEMA_SQL" ]; then
  echo "📄 Running schema-pg.sql..."
  sudo -u postgres psql -d "$DB_NAME" -f "$SCHEMA_SQL"
fi

# === 10. Cleanup ===
echo "🧹 Cleaning up..."
rm -rf "$CLONE_DIR"
rm -f "$HOME_DIR/deploy-remote.sh"
rm -f "$HOME_DIR/.env.frontend.production"
rm -f "$HOME_DIR/.env.backend.production"
echo -e "\n✅ Deployment complete! Visit: https://$DOMAIN"
