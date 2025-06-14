#!/bin/bash

echo "----- Deployment script started ---"
# Define variables for directories and repositories
REPO_NAME="keng"
VHOST_NAME="Example"

# Auto generated
PROJECT_ROOT="/usr/local/lsws/$VHOST_NAME"
REPO_URL="https://github.com/arrafi-ahmed/$REPO_NAME.git"
REPO_DIR="$PROJECT_ROOT/$REPO_NAME"
HTML_DIR="$PROJECT_ROOT/html"

# Exit immediately if a command exits with a non-zero status
set -e

# Function to remove existing files and directories in /usr/local/lsws/wayzaway/html
remove_existing_files() {
  local files=(
    assets
    favicon.ico
    img
    index.html
    maintanance.html
    site.webmanifest
  )
  for file in "${files[@]}"; do
    if [ -e "$HTML_DIR/$file" ]; then
      if [ -d "$HTML_DIR/$file" ]; then
        rm -rf "$HTML_DIR/$file" && \
        echo "----- Directory $HTML_DIR/$file removed..."
      else
        rm -f "$HTML_DIR/$file" && \
        echo "----- File $HTML_DIR/$file removed..."
      fi
    fi
  done
}

# Check if the project directory exists, and if it does, remove it
if [ -d "$REPO_DIR" ]; then
  echo "----- Directory $REPO_DIR already exists..."
  rm -rf "$REPO_DIR" && \
  echo "----- Directory $REPO_DIR removed..."
fi

# Change directory to the project directory and clone the repository
cd "$PROJECT_ROOT" && \
git clone "$REPO_URL" && \
echo "----- Git clone done..."

# Navigate to the client directory, setup the client environment, and build the client application
cd "$REPO_DIR/client" && \
npm run in && \
npm run build && \
remove_existing_files && \
mv dist/* "$HTML_DIR" && \
echo "----- Client build done..."

# Navigate to the Node directory and clean up (remove all files except 'public')
cd "$HTML_DIR/node" && \
find . -mindepth 1 -maxdepth 1 ! -name 'public' -exec rm -rf {} + && \
echo "----- Project Node dir cleaned..."

# Sync API files to the node directory (excluding 'public' folder)
if [ -d "$HTML_DIR/node/public" ]; then
  rsync -av --progress --exclude public "$REPO_DIR/api/" "$HTML_DIR/node" && \
  echo "----- Project Node synced (with exclusion)..."
else
  rsync -av --progress "$REPO_DIR/api/" "$HTML_DIR/node" && \
  echo "----- Project Node synced (no exclusion)..."
fi

# Navigate to the node directory and setup the node environment
cd "$HTML_DIR/node" && \
npm run in && \
echo "----- Api setup done..." && \

if [ -d "$REPO_DIR" ]; then
  rm -rf "$REPO_DIR" && \
  echo "----- Junk directory $REPO_DIR removed..."
fi

#After deployment change file permission of public folder:
find "$HTML_DIR/node/public" -type f -exec chmod 777 {} \; && \
find "$HTML_DIR/node/public" -type d -exec chmod 777 {} \; && \
echo "----- Public dir & files permission modified..."

echo "----- Deployment script ended ---"