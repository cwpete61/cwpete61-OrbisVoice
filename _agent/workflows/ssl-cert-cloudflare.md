---
description: Automatically generate and renew SSL certificates via Cloudflare using a Self-Signed Origin Certificate and Full Encryption
---

# Workflow: SSL Cert Management (Cloudflare & Self-Signed Origin)

This workflow describes the robust, "set it and forget it" SSL strategy using **Cloudflare** as a proxy with a **Self-Signed Origin Certificate** on your VPS. 

This entirely eliminates the need for Let's Encrypt renewals, `certbot` scripts, or GitHub Actions for SSL generation.

## 1. Prerequisites
- Your domain's DNS is managed by **Cloudflare**.
- The `A` or `CNAME` records pointing to your server have the **"Proxied"** (orange cloud) status turned ON.

## 2. Infrastructure Setup (VPS & Nginx)

Instead of fetching a real certificate from Let's Encrypt for your origin server, we generate a 10-year self-signed certificate. Cloudflare will trust this certificate when proxying user traffic.

### Step 2.1: Generate the Self-Signed Certificate
Run the following commands on your origin VPS:

```bash
# Create the directory where Nginx expects the certificates
mkdir -p /opt/app-name/nginx/certs

# Generate a 10-year (3650 days) self-signed SSL certificate
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /opt/app-name/nginx/certs/privkey.pem \
  -out /opt/app-name/nginx/certs/fullchain.pem \
  -subj "/C=US/ST=CA/L=San Francisco/O=YourApp/CN=yourdomain.com"
```

### Step 2.2: Ensure Nginx is Mounted Properly
Make sure your Docker/Nginx deployment exposes port 443 and maps the certificate volume correctly in your `docker-compose.prod.yml`:

```yaml
  nginx:
    image: nginx:alpine
    container_name: your-app-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"  # Must have 443 exposed!
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro # Mount the certs directory!
```

### Step 2.3: Reload Nginx
After generating the certificate and ensuring your composition file is correct, reload or restart your Nginx container:
```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

## 3. Cloudflare Configuration

Now that your local Nginx instance is cleanly serving the self-signed certificate, update Cloudflare to leverage it:

1. Open your domain's dashboard inside Cloudflare.
2. Navigate to **SSL/TLS** > **Overview** in the left sidebar.
3. Change your encryption mode to **Full** (Do NOT choose "Full (Strict)").
   - *Explanation: "Full" encrypts traffic between Cloudflare and your server but does not validate the certificate authority, making it perfect for our 10-year self-signed certificate. "Full (Strict)" requires a trusted CA or Cloudflare Origin CA, which our cert is not.*

## 4. Troubleshooting

### My site returns a 521 Error
This usually indicates Cloudflare cannot connect to port 443. Check:
- Are your ports exposed correctly in `docker-compose`?
- Check Nginx logs (`docker logs nginx-container-name`) for missing file errors.
- Ensure your Cloudflare SSL mode is "Full", not "Strict".

### My site returns a 522 Error
The connection timed out. 
- Ensure your server's firewall (ufw, iptables) allows incoming TCP traffic on port 443.
- Ensure the Cloudflare Proxy (orange cloud) is turned ON.
