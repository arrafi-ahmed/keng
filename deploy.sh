#!/bin/bash

### === CONFIGURATION === ###
PROJECT_NAME="keng"
DOMAIN="quthentic.com"
PORT=3000  # Port your Node backend listens on
SITE_DIR="/home/cloudpanel/htdocs/$DOMAIN"
REPO_URL="https://github.com/arrafi-ahmed/$PROJECT_NAME.git"
CLONE_DIR="$SITE_DIR/tmp-deploy"
### ====================== ###

set -e

echo "\n🚀 Starting deployment for $PROJECT_NAME on $DOMAIN..."

# === 1. Clone fresh repo ===
echo "🔄 Cloning repo..."
rm -rf "$CLONE_DIR"
git clone "$REPO_URL" "$CLONE_DIR"

# === 2. Build frontend ===
echo "🛠 Building frontend..."
cd "$CLONE_DIR/frontend"
npm install --legacy-peer-deps
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

# === 9. Cleanup ===
echo "🧹 Cleaning up..."
rm -rf "$CLONE_DIR"
echo "\n✅ Deployment complete! Visit: https://$DOMAIN"
