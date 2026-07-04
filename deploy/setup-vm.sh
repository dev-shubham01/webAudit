#!/usr/bin/env bash
# One-shot provisioning script for a fresh Ubuntu VM (GCP e2-micro Always-Free
# tier). Installs Node, real Chrome (for Lighthouse), Caddy (for automatic
# HTTPS), pm2 (to keep the backend alive across crashes/reboots), clones the
# repo, and starts everything.
#
# Usage (run as the VM's default user, e.g. via SSH):
#   curl -fsSL https://raw.githubusercontent.com/<your-username>/<your-repo>/main/deploy/setup-vm.sh | bash -s -- <REPO_URL> <SSLIP_HOSTNAME>
# or copy this file to the VM and run:
#   bash setup-vm.sh <REPO_URL> <SSLIP_HOSTNAME>
#
# <SSLIP_HOSTNAME> looks like 34-123-45-67.sslip.io (dashes, not dots, for the
# IP) -- replace with your VM's actual static external IP after reserving it.

set -euo pipefail

REPO_URL="${1:?Usage: setup-vm.sh <repo-url> <sslip-hostname>}"
HOSTNAME="${2:?Usage: setup-vm.sh <repo-url> <sslip-hostname>}"
APP_DIR="$HOME/webAudit"

echo "==> Updating system packages"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Installing git (minimal cloud images often don't include it)"
sudo apt-get install -y git

echo "==> Installing Node.js 22 (via NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Installing real Google Chrome (for Lighthouse -- same reasoning as"
echo "    the Docker approach: puppeteer's own bundled Chromium needs system"
echo "    libraries a minimal image lacks; installing Chrome directly is the"
echo "    reliable path)"
sudo apt-get install -y wget gnupg ca-certificates
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update -y
sudo apt-get install -y google-chrome-stable

echo "==> Installing Caddy (automatic HTTPS reverse proxy)"
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update -y
sudo apt-get install -y caddy

echo "==> Installing pm2 (process manager -- keeps the app alive)"
sudo npm install -g pm2

echo "==> Cloning the app"
if [ -d "$APP_DIR" ]; then
  echo "    $APP_DIR already exists, pulling latest instead"
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "==> Installing backend dependencies"
cd "$APP_DIR/backend"
PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable npm install

echo "==> Writing backend/.env"
cat > "$APP_DIR/backend/.env" <<EOF
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PORT=3000
EOF

echo "==> Configuring Caddy reverse proxy (HTTPS via $HOSTNAME)"
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
$HOSTNAME {
  reverse_proxy localhost:3000
}
EOF
sudo systemctl restart caddy
sudo systemctl enable caddy

echo "==> Starting the backend with pm2"
cd "$APP_DIR/backend"
pm2 start src/server.js --name webhealth-backend
pm2 save
# Run the command pm2 prints below once manually if this is the VM's first
# ever pm2 setup, so the app also restarts automatically after a VM reboot:
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1

echo ""
echo "==> Done. Your backend should be reachable at: https://$HOSTNAME"
echo "    Test it with: curl https://$HOSTNAME/"
echo "    View logs with: pm2 logs webhealth-backend"
