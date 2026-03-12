# OrbisVoice VPS SSH Configuration

## Server Details

| Parameter             | Value                     |
| --------------------- | ------------------------- |
| **Host/IP**           | `147.93.183.4`            |
| **Username**          | `root`                    |
| **SSH Port**          | `22`                      |
| **SSH Key Path**      | `C:\Users\crawf\.ssh\orbis_deploy_key` |
| **Project Directory** | `/opt/orbisvoice`         |

## Quick SSH Command

```bash
ssh -i C:\Users\crawf\.ssh\orbis_deploy_key -o StrictHostKeyChecking=no root@147.93.183.4
```

## Saved Connection Configuration (PuTTY-style)

To make it easy for Opencode (or you) to connect without typing everything every time, add this to your **local computer's** SSH config file (usually at `C:\Users\crawf\.ssh\config`):

```ssh
Host orbisvoice-prod
    HostName 147.93.183.4
    User root
    IdentityFile C:\Users\crawf\.ssh\orbis_deploy_key
    StrictHostKeyChecking no
```

**Once saved, Opencode can connect simply by using:**
`ssh orbisvoice-prod`

## Deploy Commands

```bash
# Navigate to project directory
cd /opt/orbisvoice

# Pull latest code
git pull origin master

# Deploy with Docker Compose
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs --tail 50 api
```

## SSH Key Fix (If Authentication Fails)

If you get "Permission denied" when connecting:

### Option 1: Add Public Key to Server

From a working SSH session on the server:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# Add the public key
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDknSeVjgyHLZjuroCCg1EJflnl/q4AwGLpfqtJ97Md5UG8n8NF4PISnK/7FUfsFIWkr3yEAjaVHuLFn9zVyICezDjkUSo5wBdsJb48v5Hz4e51XJC/MCxCcABLdjXP6JeXtrsoZZ7VFkmqVUendHWpZI0epGBf42ZOAi3mtSQgfA2DYDH6+4KWBRDdzICZ8jEBKkg10q7PpqdX2KPRYRYYHmoIkisSFSO+US00MYAXdu8RJN6hYaHY7mpM4KNk7F/371RFIpM8HFeMlEn5eIPeG0Heq09xyit0afW3jybsgVmIKyrS7p/Rw0ng04pmFt9j56JrM7yfOcPUtz9RaNi4g3Q1BvMk0Or0BsqwBLQzFBP/9+SptbASx2CUSzCT780RP8eqSytpN8usyjYHUi6CIktwBTr6D7YsOEPTwgcHFwyBOiVQ9T9DiUqpECp5WW670PYclSBapHh9MU7LMUowT+KIBkbR+TT3AxFcKoeaJowKGVAHfDYlC9d/ibaO3ie9AWot3b9uQkAFFU/mL6qAlhfimwRhucnWiCVBguI7yKUm+iWfojLkxSx3b0fwKvMyHlYvbCSXwa5C119UMixqg1mi1mSfIT753zKQK6ukjK7DOcTWmlZBk3VK0TXG10NyOVMCcmU+KiVCh/cO0zAx/VzzeW9HWgQyO7UyyKRHOw== crawf@Zeus" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### Option 2: Use Password (Temporary)

```bash
ssh root@147.93.183.4
# Password: Orbis@8214@@!!
```

## Docker Services

| Service       | Container Name                  | Port            |
| ------------- | ------------------------------- | --------------- |
| API           | `orbisvoice-api-prod`           | 4001            |
| Web           | `orbisvoice-web-prod`           | 3000            |
| Voice Gateway | `orbisvoice-voice-gateway-prod` | 4001            |
| PostgreSQL    | `orbisvoice-postgres-prod`      | 5440 (external) |
| Redis         | `orbisvoice-redis-prod`         | 6379            |
| Nginx         | `orbisvoice-nginx-prod`         | 80, 443         |

## Environment Variables

The `.env.prod` file should be located at `/opt/orbisvoice/.env.prod` on the server.

Required variables:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GEMINI_API_KEY`

## Useful Commands

```bash
# Check all containers
docker compose -f docker-compose.prod.yml ps

# Restart specific service
docker compose -f docker-compose.prod.yml restart api

# View real-time logs
docker compose -f docker-compose.prod.yml logs -f api

# Check database
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d orbisvoice

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres orbisvoice > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### 502 Bad Gateway Error

```bash
# Check API logs
docker compose -f docker-compose.prod.yml logs --tail 100 api

# Verify API is running
docker compose -f docker-compose.prod.yml exec nginx curl http://api:4001/health

# Restart API
docker compose -f docker-compose.prod.yml restart api
```

### Container Won't Start

```bash
# Force recreate
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Check for port conflicts
netstat -tulpn | grep -E '4001|3000|5440|6379|80|443'
```

---

_Created: 2026-03-12_
