#!/bin/bash

set -x

### === GLOBAL CONFIGURATION === ###
ROOT_DIR="/root"
REMOTE_FRONTEND_ENV="$ROOT_DIR/.env.frontend.production"
REMOTE_BACKEND_ENV="$ROOT_DIR/.env.backend.production"

echo
if [ ! -f "$REMOTE_FRONTEND_ENV" ]; then
  echo "❌ Missing frontend env file: $REMOTE_FRONTEND_ENV"
  exit 1
fi

echo
if [ ! -f "$REMOTE_BACKEND_ENV" ]; then
  echo "❌ Missing backend env file: $REMOTE_BACKEND_ENV"
  exit 1
fi

echo
echo "🔑 Loading environment variables from $REMOTE_FRONTEND_ENV and $REMOTE_BACKEND_ENV..."
set -a # Automatically export all variables defined or modified
source "$REMOTE_FRONTEND_ENV"
source "$REMOTE_BACKEND_ENV"
set +a # Turn off auto-exporting

: "${PROJECT_NAME:?Missing PROJECT_NAME (Git repo name) in env}"
: "${FRONTEND_DOMAIN:?Missing FRONTEND_DOMAIN (e.g., quthentic.com) in env}"
: "${FRONTEND_SITE_USER:?Missing FRONTEND_SITE_USER (e.g., quthentic) in env}"
: "${BACKEND_DOMAIN:?Missing BACKEND_DOMAIN (e.g., api.quthentic.com) in env}"
: "${BACKEND_SITE_USER:?Missing BACKEND_SITE_USER (e.g., quthentic-api) in env}"
: "${PORT:?Missing PORT (Node.js app port, e.g., 3000) in env}"
: "${DB_NAME:?Missing DB_NAME in env}"
: "${DB_USER:?Missing DB_USER in env}"
: "${DB_PASS:?Missing DB_PASS in env}"

FRONTEND_SITE_DIR="/home/$FRONTEND_SITE_USER/htdocs/$FRONTEND_DOMAIN"
BACKEND_SITE_DIR="/home/$BACKEND_SITE_USER/htdocs/$BACKEND_DOMAIN"

REPO_URL="https://github.com/arrafi-ahmed/$PROJECT_NAME.git"
GLOBAL_CLONE_DIR="/tmp/$PROJECT_NAME-clone"

set -e

echo
echo "🚀 Starting unified deployment for $PROJECT_NAME."

echo
echo "1.0 Ensuring base directory permissions for system users ($FRONTEND_SITE_USER, $BACKEND_SITE_USER)."
chmod o+x "/home/$FRONTEND_SITE_USER/htdocs" || true
chmod o+x "/home/$FRONTEND_SITE_USER" || true
chmod o+x "/home/$BACKEND_SITE_USER/htdocs" || true
chmod o+x "/home/$BACKEND_SITE_USER" || true

echo
echo "2.0 Installing Node.js and npm (if not installed)."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt update
  apt install -y nodejs
fi

echo
echo "3.0 Installing PM2 globally (if not installed)."
if ! command -v pm2 &> /dev/null; then
  npm install pm2@latest -g
fi

echo
echo "4.0 Installing PostgreSQL (if not installed)."
if ! command -v psql &> /dev/null; then
  apt update
  apt install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

echo
echo "5.0 Configuring PostgreSQL database and user."
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME WITH OWNER $DB_USER;"
fi

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo
echo "6.0 Cloning repo into temporary global directory: $GLOBAL_CLONE_DIR."
rm -rf "$GLOBAL_CLONE_DIR"
git clone "$REPO_URL" "$GLOBAL_CLONE_DIR"

# === FRONTEND DEPLOYMENT ===
echo
echo "7.0 Starting Frontend Deployment ($FRONTEND_DOMAIN) for user $FRONTEND_SITE_USER."

echo
echo "7.1 Creating frontend site directory: $FRONTEND_SITE_DIR."
mkdir -p "$FRONTEND_SITE_DIR"

echo
echo "7.2 Copying frontend source and environment file."
rm -rf "$FRONTEND_SITE_DIR/frontend"
cp -r "$GLOBAL_CLONE_DIR/frontend" "$FRONTEND_SITE_DIR/"
cp "$REMOTE_FRONTEND_ENV" "$FRONTEND_SITE_DIR/frontend/.env.production"

echo
echo "7.3 Building frontend."
cd "$FRONTEND_SITE_DIR/frontend"

echo
echo "7.3.1 Cleaning npm cache before install."
npm cache clean --force

echo
echo "7.3.2 Installing npm dependencies for frontend."
NODE_ENV=development npm install

echo
echo "7.3.3 Running frontend build."
NODE_ENV=production npm run build

echo
echo "✅ Frontend build complete."

echo
echo "7.4 Deploying built frontend files to $FRONTEND_SITE_DIR."
DIST_DIR="$FRONTEND_SITE_DIR/frontend/dist"

if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A "$DIST_DIR" 2>/dev/null)" ]; then
  echo "❌ Build failed or dist folder is empty: $DIST_DIR"
  exit 1
fi

rm -rf "$FRONTEND_SITE_DIR/index.html" || true
rm -rf "$FRONTEND_SITE_DIR/favicon.ico" || true
rm -rf "$FRONTEND_SITE_DIR/assets" || true

cp -r "$DIST_DIR"/* "$FRONTEND_SITE_DIR/"
echo "✅ Frontend files deployed."

echo
echo "7.5 Setting correct ownership and permissions for frontend files."
chown -R "$FRONTEND_SITE_USER:$FRONTEND_SITE_USER" "$FRONTEND_SITE_DIR"
find "$FRONTEND_SITE_DIR" -type d -exec chmod 755 {} \;
find "$FRONTEND_SITE_DIR" -type f -exec chmod 644 {} \;
chmod 600 "$FRONTEND_SITE_DIR/frontend/.env.production"

# === BACKEND DEPLOYMENT ===
echo
echo "8.0 Starting Backend Deployment ($BACKEND_DOMAIN) for user $BACKEND_SITE_USER."

echo
echo "8.1 Creating backend site directory: $BACKEND_SITE_DIR."
mkdir -p "$BACKEND_SITE_DIR"

echo
echo "8.2 Copying backend source and environment file."
rm -rf "$BACKEND_SITE_DIR/backend"
cp -r "$GLOBAL_CLONE_DIR/backend" "$BACKEND_SITE_DIR/"
cp "$REMOTE_BACKEND_ENV" "$BACKEND_SITE_DIR/backend/.env.production"

echo
echo "8.3 Preserving /public/ folder if it exists in backend."
if [ -d "$BACKEND_SITE_DIR/backend/public" ] && [ "$(ls -A $BACKEND_SITE_DIR/backend/public 2>/dev/null)" ]; then
  mv "$BACKEND_SITE_DIR/backend/public" "$BACKEND_SITE_DIR/public_backup"
fi

echo
echo "8.4 Setting up Node app (Backend)."
cd "$BACKEND_SITE_DIR/backend"
npm install

echo
echo "8.5 Restoring /public/ if it was backed up for backend."
if [ -d "$BACKEND_SITE_DIR/public_backup" ]; then
  rm -rf "$BACKEND_SITE_DIR/backend/public"
  mv "$BACKEND_SITE_DIR/public_backup" "$BACKEND_SITE_DIR/backend/public"
fi

echo
echo "8.6 Creating PM2 logs directory."
mkdir -p "$BACKEND_SITE_DIR/backend/logs"

echo
echo "8.6.1 Setting up PM2 ecosystem.config.js for backend."
cat <<EOF > "$BACKEND_SITE_DIR/backend/ecosystem.config.js"
module.exports = {
  apps: [{
    name: "${PROJECT_NAME}-api",
    script: "app.js",
    cwd: "${BACKEND_SITE_DIR}/backend",
    instances: 1,
    autorestart: true,
    watch: false,
    out_file: "./logs/pm2-out.log",
    error_file: "./logs/pm2-error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    env_production: {
      NODE_ENV: "production",
      PORT: "${PORT}"
    }
  }]
};
EOF

echo
echo "8.7 Setting correct ownership and permissions for backend files."
chown -R "$BACKEND_SITE_USER:$BACKEND_SITE_USER" "$BACKEND_SITE_DIR"
find "$BACKEND_SITE_DIR" -type d -exec chmod 755 {} \;
find "$BACKEND_SITE_DIR" -type f -exec chmod 644 {} \;
chmod 600 "$BACKEND_SITE_DIR/backend/.env.production"
chmod -R o+rX "$GLOBAL_CLONE_DIR/backend"

echo
echo "8.8 Setting up PM2 daemon to start on boot for user $BACKEND_SITE_USER."

echo
echo "8.8.1 Stopping and removing any conflicting PM2 systemd services."
for svc_user in "$BACKEND_SITE_USER" root; do
    if systemctl list-units --all | grep -q "pm2-$svc_user.service"; then
        sudo systemctl stop "pm2-$svc_user.service" || true
        sudo systemctl disable "pm2-$svc_user.service" || true
        sudo rm "/etc/systemd/system/pm2-$svc_user.service"
    fi
done
sudo systemctl daemon-reload
sudo systemctl reset-failed

echo
echo "8.8.2 Ensuring local PM2 daemon for $BACKEND_SITE_USER is killed and .pm2 directory is clean."
sudo -u "$BACKEND_SITE_USER" pm2 kill || true
sudo rm -rf "/home/$BACKEND_SITE_USER/.pm2"

echo
echo "8.8.3 Generating and executing PM2 startup command for $BACKEND_SITE_USER."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$BACKEND_SITE_USER" --hp "/home/$BACKEND_SITE_USER"
if [ $? -eq 0 ]; then
    echo "✅ PM2 daemon startup script configured and enabled."
else
    echo "❌ ERROR: PM2 startup command failed with exit code $?. Manual investigation needed."
    exit 1
fi

echo
echo "8.9 Starting/Restarting backend with PM2 as $BACKEND_SITE_USER."
sudo -u "$BACKEND_SITE_USER" pm2 start "$BACKEND_SITE_DIR/backend/ecosystem.config.js" --env production || sudo -u "$BACKEND_SITE_USER" pm2 restart "$PROJECT_NAME-api"

echo
echo "8.10 Saving PM2 process list for $BACKEND_SITE_USER."
sudo -u "$BACKEND_SITE_USER" pm2 save

# --- Backend Health Check ---
echo
echo "8.11 🔍 Testing backend health at http://127.0.0.1:$PORT/info"

MAX_RETRIES=5
RETRY_INTERVAL=2
HEALTHCHECK_URL="http://127.0.0.1:$PORT/info"
SUCCESS=false

for ((i=1; i<=MAX_RETRIES; i++)); do
  if curl --fail --silent "$HEALTHCHECK_URL" > /dev/null; then
    echo -e "✅ Backend is healthy after $i attempt(s)."
    SUCCESS=true
    break
  else
    echo -e "⏳ Attempt $i: Backend not yet healthy. Retrying in ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
  fi
done

if [ "$SUCCESS" = false ]; then
  echo -e "\n❌ Backend health check failed after $MAX_RETRIES attempts. Something’s wrong."
  exit 1
fi

# --- Add wait for PM2 service to be active ---
echo
echo "8.12 Waiting for pm2-$BACKEND_SITE_USER.service to be active..."
RETRY_COUNT=0
while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do
    if sudo systemctl is-active --quiet "pm2-$BACKEND_SITE_USER.service"; then
        echo "✅ pm2-$BACKEND_SITE_USER.service is active."
        break
    else
        echo "Waiting for pm2-$BACKEND_SITE_USER.service to become active (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
        sleep 5
        RETRY_COUNT=$((RETRY_COUNT+1))
    fi
done

if [ "$RETRY_COUNT" -eq "$MAX_RETRIES" ]; then
    echo "❌ ERROR: pm2-$BACKEND_SITE_USER.service did not become active after $MAX_RETRIES attempts. Manual intervention may be required."
    sudo systemctl status "pm2-$BACKEND_SITE_USER.service" --no-pager
#    exit 1
fi
# --- End wait for PM2 service ---
# --- End Backend Health Check ---

echo
echo "9.0 Setting up PostgreSQL schema if exists."
if [ -f "$GLOBAL_CLONE_DIR/backend/schema-pg.sql" ]; then
  chown postgres:postgres "$GLOBAL_CLONE_DIR/backend/schema-pg.sql"
  chmod 600 "$GLOBAL_CLONE_DIR/backend/schema-pg.sql"

  sudo -u postgres psql -d "$DB_NAME" -f "$GLOBAL_CLONE_DIR/backend/schema-pg.sql"
fi

echo
echo "10.0 Cleaning up global clone directory."
rm -rf "$GLOBAL_CLONE_DIR"
rm -f "$ROOT_DIR/deploy-remote.sh"
rm -f "$REMOTE_FRONTEND_ENV"
rm -f "$REMOTE_BACKEND_ENV"
echo
echo "✅ Deployment complete! Visit: https://$FRONTEND_DOMAIN (Frontend) and https://$BACKEND_DOMAIN (API)"
