#!/bin/bash

# Enable detailed logging for debugging
set -x

### === CONFIGURATION === ###
ROOT_DIR="/root"
REMOTE_FRONTEND_ENV="$ROOT_DIR/.env.frontend.production"
REMOTE_BACKEND_ENV="$ROOT_DIR/.env.backend.production"

# Check if the backend env file exists before proceeding
if [ ! -f "$REMOTE_BACKEND_ENV" ]; then
  echo "❌ Missing backend env file: $REMOTE_BACKEND_ENV"
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

echo "Ensuring base directory permissions for system users..."
# Grant execute/traverse permission to 'others' on /home/keng/htdocs
# This is crucial for Nginx (www-data) and PostgreSQL (postgres) to access your site files
chmod o+x /home/keng/htdocs
# You may also need this for /home/keng if it's too restrictive (check 'ls -ld /home/keng')
chmod o+x /home/keng

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

# === 0.1 Configure PostgreSQL DB/User ===
echo "⚙️ Configuring PostgreSQL database and user..."

# Create database user if it doesn't exist
# Note: In PostgreSQL, "user" and "role" are largely interchangeable. pg_roles is the catalog table.
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  echo "Creating PostgreSQL user: $DB_USER..."
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"
else
  echo "PostgreSQL user '$DB_USER' already exists. Skipping creation."
fi

# Create database if it doesn't exist
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  echo "Creating PostgreSQL database: $DB_NAME with owner: $DB_USER..."
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME WITH OWNER $DB_USER;"
else
  echo "PostgreSQL database '$DB_NAME' already exists. Skipping creation."
fi

# Grant all privileges on the database to the user
echo "Granting all privileges on database $DB_NAME to user $DB_USER..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Grant all privileges on the public schema (this is important for most apps)
# This command needs to be executed while connected to the specific database
echo "Granting all privileges on public schema in $DB_NAME to user $DB_USER..."
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "✅ PostgreSQL database and user configured."

# === 1. Clone fresh repo ===
echo "🔄 Cloning repo..."
rm -rf "$CLONE_DIR"
git clone "$REPO_URL" "$CLONE_DIR"

# === 1.1 Move env files to correct locations ===
echo "📁 Placing .env files into backend and frontend..."
cp "$REMOTE_FRONTEND_ENV" "$CLONE_DIR/frontend/.env.production"
cp "$REMOTE_BACKEND_ENV" "$CLONE_DIR/backend/.env.production"

# === 1.2 Clean package-lock from both frontend & backend ===
echo "🧹 Cleaning package-lock.json..."
rm -rf "$CLONE_DIR/frontend/package-lock.json"
rm -rf "$CLONE_DIR/backend/package-lock.json"

# === 2. Build frontend ===
echo "🛠 Building frontend..."
cd "$CLONE_DIR/frontend"

# VERY IMPORTANT: Clear npm cache before install
echo "🧹 Cleaning npm cache before install..."
# Separate commands for clearer error reporting in the script logs
npm cache clean --force

echo "📦 Installing npm dependencies..."
NODE_ENV=development npm install

echo "🏗 Running frontend build..."
NODE_ENV=production npm run build

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
# CRITICAL: Explicitly copy the .env.production file for the backend
cp "$CLONE_DIR/backend/.env.production" "$SITE_DIR/backend/.env.production"

# === 5. Restore /public/ if it was backed up ===
if [ -d "$SITE_DIR/public_backup" ]; then
  echo "♻️ Restoring public folder..."
  rm -rf "$SITE_DIR/backend/public"
  mv "$SITE_DIR/public_backup" "$SITE_DIR/backend/public"
fi

# === 6. Setup Node app ===
cd "$SITE_DIR/backend"
echo "📦 Installing backend dependencies..."
npm install

# === 7. Setup PM2 ecosystem config ===
echo "⚙️ Setting up PM2 ecosystem.config.js..."
cat <<EOF > ecosystem.config.js
module.exports = {
  apps: [{
    name: "$PROJECT_NAME-api",
    script: "app.js",
    cwd: "$SITE_DIR/backend",
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

echo "Changing ownership and permissions for site files..."
chown -R "$SITE_USER:$SITE_USER" "$SITE_DIR"
find "$SITE_DIR" -type d -exec chmod 755 {} \;
find "$SITE_DIR" -type f -exec chmod 644 {} \;
chmod 600 "$SITE_DIR/backend/.env.production"
# Ensure this is still in the schema setup section for the temporary file
chmod -R o+rX "$CLONE_DIR/backend"

echo "✅ File ownership and permissions updated for $SITE_DIR."

pm2 start ecosystem.config.js || pm2 restart "$PROJECT_NAME-api"
pm2 save
pm2 startup

# === 8. Setup Nginx for full site serving (Frontend + Backend Proxy) ===
NGINX_SITE_CONF="/etc/nginx/sites-available/$DOMAIN.conf"
NGINX_SYMLINK="/etc/nginx/sites-enabled/$DOMAIN.conf"

echo "🌐 Configuring Nginx for full site serving on $DOMAIN..."

cat <<EOF > "$NGINX_SITE_CONF"
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    return 301 https://\$host\$request_uri;
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # >>> Your SSL certificate paths <<<
    ssl_certificate /etc/nginx/ssl-certificates/$DOMAIN.crt;
    ssl_certificate_key /etc/nginx/ssl-certificates/$DOMAIN.key;
    # ssl_trusted_certificate /etc/nginx/ssl-certificates/fullchain.pem; # Optional, for SSL stapling warnings

    # >>> CRITICAL: This is the root directory for your frontend files <<<
    root $SITE_DIR/htdocs;
    index index.html index.htm; # Default files to look for

    # >>> Your existing API proxy block goes INSIDE this server block <<<
    location /api/ {
        proxy_pass http://127.0.0.1:$PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # >>> CRITICAL: This handles all other frontend requests (including Vue Router history mode) <<<
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Optional: Error page configuration
    error_page 404 /404.html;
    location = /404.html {
        internal;
    }

    # Optional: Caching for static assets (good practice)
    location ~* \.(css|js|gif|jpe?g|png|svg|eot|otf|ttf|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files \$uri =404;
    }
}
EOF

# Create symlink to enable the site
ln -sf "$NGINX_SITE_CONF" "$NGINX_SYMLINK"

# Remove the default Nginx site config if it exists (to prevent conflicts)
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "Removing default Nginx site config to prevent conflicts..."
    rm "/etc/nginx/sites-enabled/default"
fi

# ... (then test and reload Nginx) ...
echo "Testing Nginx configuration and reloading..."
nginx -t && systemctl reload nginx
echo "✅ Nginx configured for $DOMAIN."

# === 9. Setup PostgreSQL schema if exists ===
SCHEMA_SQL="$CLONE_DIR/backend/schema-pg.sql"
if [ -f "$SCHEMA_SQL" ]; then
  echo "📄 Running schema-pg.sql..."
   # Set temporary ownership and permissions for schema-pg.sql for the postgres user
   # This makes the file owned by postgres and only readable by postgres user
   chown postgres:postgres "$SCHEMA_SQL"
   chmod 600 "$SCHEMA_SQL" # owner (postgres) read/write, no access for group/others

   sudo -u postgres psql -d "$DB_NAME" -f "$SCHEMA_SQL"

   # No need to revert permissions as "$CLONE_DIR" is removed in the cleanup step later.
   echo "✅ schema-pg.sql executed."
fi

# === 10. Cleanup ===
echo "🧹 Cleaning up..."
rm -rf "$CLONE_DIR"
rm -f "$ROOT_DIR/deploy-remote.sh"
rm -f "$REMOTE_FRONTEND_ENV"
rm -f "$REMOTE_BACKEND_ENV"
echo -e "\n✅ Deployment complete! Visit: https://$DOMAIN"
