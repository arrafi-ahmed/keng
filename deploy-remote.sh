#!/bin/bash

# Enable detailed logging for debugging
set -x

### === CONFIGURATION === ###
REMOTE_FRONTEND_ENV="/root/.env.frontend.production"
REMOTE_BACKEND_ENV="/root/.env.backend.production"

echo "DEBUG: Current directory (before checks): $(pwd)"
echo "DEBUG: Checking for backend env at: $REMOTE_BACKEND_ENV"

# Check if the backend env file exists before proceeding
if [ ! -f "$REMOTE_BACKEND_ENV" ]; then
  echo "❌ Missing backend env file: $REMOTE_BACKEND_ENV"
  # Add more debug for what's actually in /root
  echo "DEBUG: Contents of /root/:"
  ls -la /root/
  exit 1
fi

# Load backend environment variables
echo "🔑 Loading $REMOTE_BACKEND_ENV variables..."
export $(grep -v '^#' "$REMOTE_BACKEND_ENV" | xargs)

# Require variables to be set
: "${PROJECT_NAME:?Missing PROJECT_NAME in env}"
: "${DOMAIN:?Missing DOMAIN in env}"
: "${PORT:?Missing PORT in env}"
: "${DB_NAME:?Missing DB_NAME in env}"
: "${DB_USER:?Missing DB_USER in env}"
: "${DB_PASS:?Missing DB_PASS in env}"
: "${SITE_USER:?Missing SITE_USER in env}"

REPO_URL="https://github.com/arrafi-ahmed/$PROJECT_NAME.git"
SITE_DIR="/home/$SITE_USER/htdocs/$DOMAIN"
CLONE_DIR="$SITE_DIR/tmp-deploy"
### ====================== ###

set -e

echo -e "\n🚀 Starting deployment for $PROJECT_NAME on $DOMAIN..."

# === 0.0 Install Node.js and npm ===
echo "🛠 Installing Node.js and npm (if not installed)..."
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing..."
  # Remove any old NodeSource setup if present to avoid conflicts
  rm -f /etc/apt/sources.list.d/nodesource.list
  rm -f /etc/apt/sources.list.d/nodesource.list.save

  # Add NodeSource APT repository (e.g., Node.js 20.x, adjust version as needed)
  # You can change nodesource_setup.sh to 18, 20, 22 based on your app's needs
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt update
  apt install -y nodejs

  echo "Node.js and npm installed successfully."
else
  echo "Node.js is already installed."
fi

# === 0.0.1 Install PM2 globally (if not installed) ===
echo "🛠 Installing PM2 globally (if not installed)..."
if ! command -v pm2 &> /dev/null; then
  npm install pm2@latest -g
  echo "PM2 installed globally."
else
  echo "PM2 is already installed."
fi

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
cp "/root/.env.frontend.production" "$CLONE_DIR/frontend/.env.production"
cp "/root/.env.backend.production" "$CLONE_DIR/backend/.env.production"

# === 1.2 Clean package-lock from both frontend & backend ===
echo "🧹 Cleaning package-lock.json..."
rm -rf "$CLONE_DIR/frontend/package-lock.json"
rm -rf "$CLONE_DIR/backend/package-lock.json"

# === 2. Build frontend ===
echo "🛠 Building frontend..."
cd "$CLONE_DIR/frontend"

# DEBUG: Print current working directory
echo "DEBUG: Current directory: $(pwd)"

# DEBUG: Print the PATH environment variable
echo "DEBUG: PATH in script: $PATH"

# DEBUG: Verify node and npm executables are found in PATH
echo "DEBUG: Which node: $(which node)"
echo "DEBUG: Which npm: $(which npm)"

# VERY IMPORTANT: Clear npm cache before install
echo "🧹 Cleaning npm cache before install..."
# Separate commands for clearer error reporting in the script logs
npm cache clean --force
if [ $? -ne 0 ]; then
  echo "ERROR: npm cache clean failed. Exiting."
  exit 1
fi

echo "📦 Installing npm dependencies..."
NODE_ENV=development npm install
if [ $? -ne 0 ]; then
  echo "ERROR: npm install failed. Exiting. Check logs above for details."
  # Add the specific debug check here again for immediate feedback
  if [ ! -d "node_modules/unplugin-auto-import" ]; then
    echo "ERROR: unplugin-auto-import directory still DOES NOT exist after npm install attempt."
    ls -la node_modules/ # List content of node_modules for inspection
  fi
  exit 1
fi

# Add the explicit verification again, even if npm install reported success
echo "DEBUG: Verifying unplugin-auto-import after npm install..."
if [ -d "node_modules/unplugin-auto-import" ]; then
  echo "DEBUG: unplugin-auto-import directory exists. Proceeding with build."
else
  echo "ERROR: unplugin-auto-import directory DOES NOT exist, even though npm install claimed success. This is problematic."
  ls -la node_modules/ # List content of node_modules for inspection
  exit 1 # Exit if the core dependency is missing
fi

echo "🏗 Running frontend build..."
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
  echo "ERROR: npm run build failed. Exiting."
  exit 1
fi

echo "✅ Frontend build complete."

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
    env: {
      NODE_ENV: "production",
      PORT: "$PORT"
    }
  }]
};
EOF

pm2 start ecosystem.config.js || pm2 restart "$PROJECT_NAME-api"
pm2 save
pm2 startup

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
rm -f "/root/deploy-remote.sh"
rm -f "/root/.env.frontend.production"
rm -f "/root/.env.backend.production"
echo -e "\n✅ Deployment complete! Visit: https://$DOMAIN"
