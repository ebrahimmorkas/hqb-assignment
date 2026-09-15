# Deploying hqhb to AWS (single EC2 instance)

Architecture: one EC2 instance runs the Node backend (via PM2) and Redis
locally; Nginx on the same instance serves the built frontend and reverse
proxies `/api` to the backend, so frontend and backend are same-origin in
production (no CORS/cross-site cookie complications). MongoDB is a free
MongoDB Atlas cluster, not self-hosted.

## 0. Create an AWS account

1. Go to https://aws.amazon.com/ → "Create an AWS Account".
2. You'll need: an email, a payment method (card - required even for free
   tier, but free-tier-eligible resources won't charge you if you stay
   within the limits), and phone verification.
3. Pick the **Basic support plan** (free).
4. Once in the console, immediately set a **budget alert**: Billing →
   Budgets → Create budget → e.g. alert at $5, so you find out fast if
   anything strays outside free tier.
5. (Recommended, not required to get started) Create an IAM user for
   yourself instead of using the root account day-to-day: IAM → Users →
   Add user → attach `AdministratorAccess` for now → use that user's
   credentials going forward.

## 1. Create a MongoDB Atlas free cluster

1. https://www.mongodb.com/cloud/atlas/register - free signup, no card
   needed for the free tier.
2. Create a free **M0** cluster (pick the AWS provider and a region close
   to wherever your EC2 instance will be, e.g. same region).
3. Database Access → add a database user (username/password - not your
   Atlas login).
4. Network Access → add an IP - for now `0.0.0.0/0` (open) is simplest to
   get running; once your EC2 instance has a fixed IP, restrict to just
   that IP (or a NAT/VPC peering setup) instead.
5. Get the connection string (Connect → Drivers → Node.js) - looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/user_management_system`.
   That's your `MONGO_URI`.

## 2. Launch the EC2 instance

1. EC2 → Launch instance.
2. AMI: **Ubuntu Server 22.04 LTS**.
3. Instance type: **t2.micro** (or t3.micro) - free tier eligible.
4. Key pair: create a new one, download the `.pem`, keep it safe - it's
   the only way to SSH in.
5. Security group - inbound rules:
   - SSH (22) - source: **My IP** only (not 0.0.0.0/0 - don't leave SSH open to the world)
   - HTTP (80) - source: 0.0.0.0/0
   - HTTPS (443) - source: 0.0.0.0/0 (once you add a domain + SSL)
6. Launch, note the instance's **public IP**.

## 3. SSH in and install prerequisites

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt update && sudo apt upgrade -y

# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx redis-server

# Redis: enable + start
sudo systemctl enable --now redis-server

# PM2 (process manager for the backend)
sudo npm install -g pm2
```

## 4. Get the code onto the instance

```bash
cd ~
git clone <your-repo-url> hqhb
cd hqhb
```

(If the repo is private, either set up a deploy key, or `scp` the project
over instead of cloning.)

## 5. Configure and start the backend

```bash
cd ~/hqhb/backend
npm ci --omit=dev
cp .env.example .env
nano .env
```

Set at minimum:
- `NODE_ENV=production`
- `MONGO_URI=` your Atlas connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` - generate fresh, strong,
  *different* values: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (run twice)
- `FRONTEND_URL=http://<EC2_PUBLIC_IP>` (or your domain, once you have one)
- `COOKIE_SECURE=0` - **important**: you don't have HTTPS yet at this
  point, and a Secure cookie is silently dropped by the browser over plain
  HTTP, which breaks login. Flip this to `1` once step 8 (SSL) is done.
- `IS_REDIS_SERVER_ON=1`, `REDIS_URL=redis://localhost:6379`

Seed the watan master list once:
```bash
npm run seed:watans
```

Start the backend under PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the one-line command it prints, so PM2 survives a reboot
```

## 6. Build and deploy the frontend

```bash
cd ~/hqhb/frontend
npm ci
npm run build
```

`VITE_API_BASE_URL` defaults to `/api` (relative) when unset - correct here,
since Nginx proxies `/api` on the same origin. No `.env` needed for the
frontend build in this setup.

```bash
sudo mkdir -p /var/www/hqhb/frontend
sudo cp -r dist /var/www/hqhb/frontend/dist
```

## 7. Configure Nginx

```bash
sudo cp ~/hqhb/deploy/nginx.conf /etc/nginx/sites-available/hqhb
sudo ln -s /etc/nginx/sites-available/hqhb /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Visit `http://<EC2_PUBLIC_IP>` - the app should be live.

## 8. (Once you have a domain) Add HTTPS

1. Point your domain's A record at the EC2 public IP.
2. Edit `/etc/nginx/sites-available/hqhb`, set `server_name yourdomain.com;`.
3. `sudo apt install -y certbot python3-certbot-nginx`
4. `sudo certbot --nginx -d yourdomain.com` - handles the cert and rewrites
   the Nginx config for HTTPS automatically.
5. In `backend/.env`: set `COOKIE_SECURE=1`, `FRONTEND_URL=https://yourdomain.com`,
   restart: `pm2 restart hqhb-backend`.

## Redeploying after a code change

```bash
cd ~/hqhb && git pull

cd backend && npm ci --omit=dev && pm2 restart hqhb-backend

cd ../frontend && npm ci && npm run build
sudo rm -rf /var/www/hqhb/frontend/dist
sudo cp -r dist /var/www/hqhb/frontend/dist
```
