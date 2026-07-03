#!/usr/bin/env bash
# One-shot provisioning script for a fresh Ubuntu VM (Oracle Cloud Always-Free
# tier -- works on both the ARM Ampere A1 shape and the AMD E2.1.Micro shape).
# Installs Node, the shared libraries headless Chrome needs, Caddy (automatic
# HTTPS), pm2 (keeps the backend alive across crashes/reboots), opens the
# VM's own firewall (Oracle images ship with iptables rules that block
# incoming traffic by default -- this trips up almost everyone), clones the
# repo, and starts everything.
#
# Usage (run as the VM's default user, e.g. via SSH):
#   bash setup-vm.sh <REPO_URL> <SSLIP_HOSTNAME>
#
# <SSLIP_HOSTNAME> looks like 34-123-45-67.sslip.io (dashes, not dots, for the
# IP) -- replace with your VM's actual public IP after reserving it.

set -euo pipefail

REPO_URL="${1:?Usage: setup-vm.sh <repo-url> <sslip-hostname>}"
HOSTNAME="${2:?Usage: setup-vm.sh <repo-url> <sslip-hostname>}"
APP_DIR="$HOME/webAudit"

echo "==> Updating system packages"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Opening the VM's own firewall (iptables) for HTTP/HTTPS/SSH."
echo "    Oracle's Ubuntu images pre-configure iptables to block incoming"
echo "    traffic -- this is separate from (and in addition to) the Security"
echo "    List rules you set in the OCI Console. Both are required."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null 2>&1 || true

echo "==> Installing Node.js 22 (via NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Installing shared libraries headless Chrome needs to launch."
echo "    (Architecture-agnostic -- these package names work on both amd64"
echo "    and arm64, unlike Google's Chrome .deb which is amd64-only. We let"
echo "    puppeteer download its own Chromium build for whatever architecture"
echo "    this VM actually is, exactly like local dev already does.)"
sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
  libxtst6 lsb-release wget xdg-utils

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

echo "==> Installing backend dependencies (puppeteer downloads its own"
echo "    Chromium here, matching the VM's actual CPU architecture)"
cd "$APP_DIR/backend"
npm install

echo "==> Writing backend/.env"
cat > "$APP_DIR/backend/.env" <<EOF
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
echo ""
echo "    If curl above doesn't work, double check the OCI Console Security"
echo "    List has ingress rules for 0.0.0.0/0 on ports 80 and 443 -- that's"
echo "    the cloud-level firewall, separate from the iptables rules this"
echo "    script just added on the VM itself."
