# Deploying the backend to a GCP Always-Free e2-micro VM

The backend runs as a normal persistent Node.js process here — no code
changes needed from local dev. SQLite (`backend/data/webhealth.db`) works
fine since the VM has a real, persistent disk.

## 1. One-time GCP setup (do this in the GCP Console)

1. Create a Google Cloud account and a new Project.
2. Enable billing on the project (required even for free-tier resources —
   you will not be charged as long as you stay within the Always Free
   limits, but it's worth setting a budget alert as a safety net:
   Billing → Budgets & alerts → create a small budget, e.g. $1).
3. Compute Engine → VM instances → Create instance:
   - Name: `webhealth-backend`
   - Region: `us-west1`, `us-central1`, or `us-east1` (Always Free e2-micro
     is only free in these three regions)
   - Machine type: `e2-micro`
   - Boot disk: Ubuntu 22.04 LTS (or later), 10GB (fits in the free 30GB
     standard persistent disk allowance)
   - Firewall: check "Allow HTTP traffic" and "Allow HTTPS traffic"
   - Create.
4. Reserve a static external IP so it doesn't change on restart:
   VPC network → IP addresses → find the VM's ephemeral IP → "Reserve"
   (promote it to static). Note this IP — you'll need it below.
5. SSH into the VM (there's an "SSH" button right in the GCP Console next to
   the instance — opens a browser-based terminal, no local setup needed).

## 2. Run the setup script

Once SSH'd into the VM, run:

```bash
curl -fsSL https://raw.githubusercontent.com/<your-username>/<your-repo>/main/deploy/setup-vm.sh -o setup-vm.sh
bash setup-vm.sh https://github.com/<your-username>/<your-repo>.git <YOUR_STATIC_IP_WITH_DASHES>.sslip.io
```

Replace `<YOUR_STATIC_IP_WITH_DASHES>` with your static IP using dashes
instead of dots — e.g. IP `34.123.45.67` becomes `34-123-45-67.sslip.io`.
This is a free "magic DNS" service that resolves to the IP embedded in the
hostname, letting Caddy get you a real HTTPS certificate without needing to
own a domain.

This installs Node, real Chrome (for Lighthouse), Caddy (automatic HTTPS),
and pm2 (keeps the app running), then starts the backend.

## 3. Point the frontend at it

In Vercel: Settings → Environment Variables → set
`VITE_API_URL=https://<YOUR_STATIC_IP_WITH_DASHES>.sslip.io`, then redeploy.

## 4. Verify

```bash
curl https://<YOUR_STATIC_IP_WITH_DASHES>.sslip.io/
# → "Server running"
```

## Redeploying after code changes

SSH into the VM and run:

```bash
cd ~/webAudit && git pull
cd backend && npm install
pm2 restart webhealth-backend
```

## Useful commands on the VM

- `pm2 logs webhealth-backend` — tail live logs
- `pm2 status` — check it's running
- `pm2 restart webhealth-backend` — restart after a crash or code change
- `sudo systemctl status caddy` — check the HTTPS proxy is up
