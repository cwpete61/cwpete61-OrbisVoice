## 🔍 Debug: Environment Initialization Failure

### 1. Symptom
The local development environment started with partial failures. Specifically, the Backend API (`apps/api`) is unreachable/broken at the data layer, and the Voice Gateway was initially conflicting on port 3000.

### 2. Information Gathered
- **Error**: `PrismaClientInitializationError: Can't reach database server at localhost:5440`
- **File**: `apps/api/src/index.ts`
- **Infrastructure**:
  - PostgreSQL (port 5440): **DOWN**
  - Redis (port 6379): **DOWN**
  - Port 3000: **CONFLICT** (Multiple services attempted to use it)

### 3. Hypotheses
1. ❓ **Docker Infrastructure Offline**: The required database and cache containers defined in `docker-compose.yml` are not running.
2. ❓ **Port Override Conflict**: The `auto_preview.py` script was forcing `PORT=3000` via environment variables, overriding individual service configurations in the monorepo.

### 4. Investigation

**Testing hypothesis 1 (Docker):**
- **Action**: Ran `docker ps`.
- **Result**: `failed to connect to the docker API`. Docker Desktop is not running on the host. 
- **Conclusion**: Correct. Required services are offline.

**Testing hypothesis 2 (Port Conflict):**
- **Action**: Checked `preview.log` and individual `package.json` files.
- **Result**: `apps/web` (Next.js) and `apps/voice-gateway` both detected port 3000. `apps/api` failed with `EADDRINUSE`.
- **Conclusion**: Correct. `auto_preview.py` is not monorepo-aware for this project's structure.

### 5. Root Cause
🎯 **Missing Local Infrastructure**: The project relies on Docker for PostgreSQL (5440) and Redis (6379), which are currently offline. Additionally, the standard `auto_preview.py` tool is incompatible with this multi-service port mapping.

### 6. Fix

**Manual Infrastructure Start (Requires Docker):**
```bash
docker-compose up -d postgres redis
```

**Dev Server Execution (Monorepo aware):**
```bash
# Avoid auto_preview.py for this project. Use pnpm directly:
pnpm -r --parallel dev
```

### 7. Prevention
🛡️ Add a pre-flight check script to `apps/api` that verifies DB connectivity before attempting to bootstrap admin users, providing a clearer "Infrastructure Offline" message instead of a crash loop. Standardize port assignments across workspaces to prevent future overlaps.
