# Deploying the backend to an Oracle Cloud Always-Free VM

The backend runs as a normal persistent Node.js process here — no code
changes needed from local dev. SQLite (`backend/data/webhealth.db`) works
fine since the VM has a real, persistent disk.

## 1. One-time Oracle Cloud setup (do this in the OCI Console)

1. Sign up at [oracle.com/cloud/free](https://oracle.com/cloud/free). Card
   verification is required even for the free tier — this is a known friction
   point for some users/regions; if signup fails, retrying with a different
   card or waiting a day sometimes resolves it.
2. Console → **Compute** → **Instances** → **Create instance**:
   - Name: `webhealth-backend`
   - **Image**: Canonical Ubuntu, version 22.04
   - **Shape**: click "Edit shape" — you have two Always-Free-eligible
     options:
     - **Ampere (ARM), `VM.Standard.A1.Flex`** — up to 4 OCPU / 24GB RAM
       total across all your A1 instances combined (check the current
       always-free allotment in the shape picker, it's occasionally
       adjusted). This is the big-RAM option, and is what the setup script
       below is built for (it's architecture-agnostic, so this just works).
     - **AMD, `VM.Standard.E2.1.Micro`** — 1GB RAM, smaller but simpler if
       you'd rather not deal with ARM at all. Also fully supported by the
       same script.
   - **Networking**: leave the default VCN (Oracle creates one
     automatically) and leave "Assign a public IPv4 address" checked.
   - **SSH keys**: Oracle requires a key pair here (no password login).
     Easiest path — select "Generate a key pair for me" and **download the
     private key file** when prompted (you only get one chance). Alternatively,
     if you already have one, generate a pair locally with `ssh-keygen -t ed25519`
     and paste the public key into the "Paste public keys" box.
   - Create.
3. **Open the cloud-level firewall** (this is required *in addition to* the
   VM's own firewall, which the setup script handles):
   Console → your VCN → the subnet → **Security Lists** → the default
   security list → **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`, IP Protocol: TCP, Destination Port: `80`
   - Add another rule the same way for port `443`
4. Note the instance's **Public IP** (shown on the instance's detail page).
   By default this IP is ephemeral and can change if you stop/start the
   instance — to make it permanent: Console → **Networking** → **IP
   Management** → **Reserved Public IPs** → create one → attach it to this
   instance's VNIC.
5. SSH in from your own terminal (Oracle doesn't have a browser-SSH button
   like some other clouds):
   ```bash
   chmod 400 /path/to/downloaded-private-key.key
   ssh -i /path/to/downloaded-private-key.key ubuntu@<PUBLIC_IP>
   ```
   (default username is `ubuntu` for Canonical images on OCI)

## 2. Run the setup script

Once SSH'd into the VM, run:

```bash
curl -fsSL https://raw.githubusercontent.com/dev-shubham01/webAudit/main/deploy/setup-vm.sh -o setup-vm.sh
bash setup-vm.sh https://github.com/dev-shubham01/webAudit.git <YOUR_PUBLIC_IP_WITH_DASHES>.sslip.io
```

Replace `<YOUR_PUBLIC_IP_WITH_DASHES>` with your public IP using dashes
instead of dots — e.g. IP `130.61.45.67` becomes `130-61-45-67.sslip.io`.
This is a free "magic DNS" service that resolves to the IP embedded in the
hostname, letting Caddy get you a real HTTPS certificate without needing to
own a domain.

This installs Node, the libraries headless Chrome needs (architecture-agnostic
— works whether you picked the ARM or AMD shape), Caddy (automatic HTTPS),
opens the VM's own firewall for ports 80/443, and pm2 (keeps the app
running), then starts the backend.

## 3. Point the frontend at it

In Vercel: Settings → Environment Variables → set
`VITE_API_URL=https://<YOUR_PUBLIC_IP_WITH_DASHES>.sslip.io`, then redeploy.

## 4. Verify

```bash
curl https://<YOUR_PUBLIC_IP_WITH_DASHES>.sslip.io/
# → "Server running"
```

If this hangs or fails, it's almost always the Security List rule from step
3 above (cloud-level firewall) — the VM's own firewall is already handled by
the setup script.

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
