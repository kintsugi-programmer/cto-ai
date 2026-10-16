# Deploy FalkorDB with Docker and Docker Compose

> **Source:** [`Deploy FalkorDB with Docker and Docker Compose - FalkorDB Docs.mhtml`](../Deploy%20FalkorDB%20with%20Docker%20and%20Docker%20Compose%20-%20FalkorDB%20Docs.mhtml) · **Type:** docs page · **Saved:** Oct 16, 2026 · **Original URL:** https://docs.falkordb.com/operations/docker

## Overview

- Official FalkorDB docs page (Operations section) covering how to run FalkorDB using Docker and Docker Compose, "providing flexible deployment options for both development and production environments."
- Page description: "Run FalkorDB with Docker and Docker Compose, covering the falkordb, falkordb-server, and falkordb-browser images plus authentication, persistence, and custom configuration."
- Covers three Docker images: `falkordb/falkordb` (server + Browser), `falkordb/falkordb-server` (server only), `falkordb/falkordb-browser` (Browser only).
- Walks through quick-start `docker run` commands, authentication, custom module configuration, four ready-made Compose setups (basic, production, split server/browser, complete production), environment variables, persistence, health checks, networking, best practices, and troubleshooting.
- Ends with Next Steps and a Frequently Asked Questions section with 5 answered questions (image differences, passwords, module parameters, data loss on restart, health checks).
- **Docs navigation (compressed):** FalkorDB Docs → Operations, alongside Migration, Durability, Replication, Cluster, Kubernetes, OpenTelemetry, Railway, FalkorDBLite, Lightning.AI, Building Docker, KubeBlocks, Docker.

## Docker Images

FalkorDB provides two main Docker images (the page states "two" but lists three):

### 1. `falkordb/falkordb`

- Includes: FalkorDB server + FalkorDB Browser
- Use case: Development, quick start, interactive exploration
- Ports:
  - `6379` - Redis/FalkorDB server
  - `3000` - FalkorDB Browser UI

### 2. `falkordb/falkordb-server`

- Includes: FalkorDB server only
- Use case: Production deployments, lighter footprint
- Ports:
  - `6379` - Redis/FalkorDB server

### 3. `falkordb/falkordb-browser`

- Includes: FalkorDB Browser UI only
- Use case: Running browser separately from the server, custom deployments
- Ports:
  - `3000` - FalkorDB Browser UI
- Configuration: Requires `FALKORDB_URL` environment variable to connect to a FalkorDB server

## Quick Start with Docker

### Running with Browser (Development)

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:latest
```

Access the browser at http://localhost:3000

### Running Server Only (Production)

```bash
docker run -p 6379:6379 -it --rm falkordb/falkordb-server:latest
```

### Running with Authentication

```bash
docker run -p 6379:6379 -p 3000:3000 -it \
  -e REDIS_ARGS="--requirepass yourpassword" \
  --rm falkordb/falkordb:latest
```

### Running with Custom Configuration

```bash
docker run -p 6379:6379 -p 3000:3000 -it \
  -e REDIS_ARGS="--requirepass yourpassword" \
  -e FALKORDB_ARGS="THREAD_COUNT 4 TIMEOUT 5000" \
  --rm falkordb/falkordb:latest
```

## Using Docker Compose

- Docker Compose provides a more flexible and maintainable way to run FalkorDB, especially when you need to configure multiple services or manage complex setups.
- Quick Start: You can download a ready-to-use `docker-compose.yml` file from the FalkorDB repository.

### Basic Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  falkordb:
    image: falkordb/falkordb:latest
    container_name: falkordb
    ports:
      - "6379:6379"
      - "3000:3000"
    environment:
      - REDIS_ARGS=--requirepass falkordb
      - FALKORDB_ARGS=THREAD_COUNT 4
    restart: unless-stopped
```

Start FalkorDB:

```bash
docker-compose up -d
```

Stop FalkorDB:

```bash
docker-compose down
```

### Production Setup with Persistence

For production environments, use the server-only image with data persistence:

```yaml
version: '3.8'

services:
  falkordb:
    image: falkordb/falkordb-server:latest
    container_name: falkordb-server
    ports:
      - "6379:6379"
    environment:
      - REDIS_ARGS=--requirepass ${FALKORDB_PASSWORD:-falkordb} --appendonly yes
      - FALKORDB_ARGS=THREAD_COUNT 8 TIMEOUT_MAX 30000
    volumes:
      - falkordb_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  falkordb_data:
    driver: local
```

Start with custom password:

```bash
FALKORDB_PASSWORD=your-secure-password docker-compose up -d
```

### Separate Server and Browser Setup

Run FalkorDB server and browser as separate containers:

```yaml
version: '3.8'

services:
  falkordb-server:
    image: falkordb/falkordb-server:latest
    container_name: falkordb-server
    ports:
      - "6379:6379"
    environment:
      - REDIS_ARGS=--requirepass falkordb
      - FALKORDB_ARGS=THREAD_COUNT 4
    volumes:
      - falkordb_data:/data
    restart: unless-stopped
    networks:
      - falkordb-network

  falkordb-browser:
    image: falkordb/falkordb-browser:latest
    container_name: falkordb-browser
    ports:
      - "3000:3000"
    environment:
      - FALKORDB_URL=redis://falkordb-server:6379
      - FALKORDB_PASSWORD=falkordb
    depends_on:
      - falkordb-server
    restart: unless-stopped
    networks:
      - falkordb-network

volumes:
  falkordb_data:
    driver: local

networks:
  falkordb-network:
    driver: bridge
```

### Complete Production Setup

A comprehensive production-ready setup with all recommended configurations:

```yaml
version: '3.8'

services:
  falkordb:
    image: falkordb/falkordb-server:latest
    container_name: falkordb-production
    ports:
      - "6379:6379"
    environment:
      # Redis Configuration
      - REDIS_ARGS=--requirepass ${FALKORDB_PASSWORD:-changeme} --appendonly yes --appendfsync everysec --maxmemory 2gb --maxmemory-policy allkeys-lru
      # FalkorDB Configuration
      - FALKORDB_ARGS=THREAD_COUNT 8 CACHE_SIZE 50 TIMEOUT_MAX 60000 TIMEOUT_DEFAULT 30000 QUERY_MEM_CAPACITY 104857600
    volumes:
      - falkordb_data:/data
      - ./falkordb-config:/etc/falkordb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "$${FALKORDB_PASSWORD:-changeme}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    networks:
      - falkordb-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  falkordb_data:
    driver: local

networks:
  falkordb-network:
    driver: bridge
```

## Docker Compose Commands

Common Docker Compose commands for managing FalkorDB:

```bash
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f falkordb

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers with volumes (WARNING: deletes data)
docker-compose down -v

# Restart services
docker-compose restart

# Check service status
docker-compose ps

# Execute commands in running container
docker-compose exec falkordb redis-cli
```

## Environment Variables

### REDIS_ARGS

Pass arguments directly to the Redis server:

```yaml
environment:
  - REDIS_ARGS=--requirepass mypassword --maxmemory 1gb --appendonly yes
```

Common Redis arguments:

- `--requirepass <password>` - Set authentication password
- `--appendonly yes` - Enable AOF persistence
- `--appendfsync everysec` - AOF sync frequency
- `--maxmemory <bytes>` - Maximum memory limit
- `--maxmemory-policy <policy>` - Eviction policy (e.g., `allkeys-lru`)

### FALKORDB_ARGS

Pass configuration to FalkorDB module:

```yaml
environment:
  - FALKORDB_ARGS=THREAD_COUNT 4 CACHE_SIZE 25 TIMEOUT_MAX 10000
```

See the Configuration page for all available FalkorDB parameters.

## Data Persistence

### Using Named Volumes

Named volumes are the recommended approach for data persistence:

```yaml
services:
  falkordb:
    image: falkordb/falkordb-server:latest
    volumes:
      - falkordb_data:/data

volumes:
  falkordb_data:
```

### Using Bind Mounts

For specific host directory mapping:

```yaml
services:
  falkordb:
    image: falkordb/falkordb-server:latest
    volumes:
      - ./falkordb-data:/data
```

Create the directory first:

```bash
mkdir -p ./falkordb-data
```

## Health Checks

Add health checks to ensure FalkorDB is running properly:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

With authentication:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "-a", "yourpassword", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Networking

### Custom Networks

Create isolated networks for better security:

```yaml
networks:
  falkordb-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Expose vs Ports

Use `expose` for internal communication and `ports` for external access:

```yaml
services:
  falkordb:
    image: falkordb/falkordb-server:latest
    expose:
      - "6379"  # Only accessible within Docker network
    # Or use ports for external access:
    # ports:
    #   - "6379:6379"
```

## Best Practices

### Use Environment Variables

Store sensitive information like passwords in `.env` files or environment variables.

Create a `.env` file:

```bash
FALKORDB_PASSWORD=your-secure-password
FALKORDB_THREADS=8
```

Reference in `docker-compose.yml`:

```yaml
environment:
  - REDIS_ARGS=--requirepass ${FALKORDB_PASSWORD}
  - FALKORDB_ARGS=THREAD_COUNT ${FALKORDB_THREADS}
```

### Enable Persistence

Always use volumes for production data:

```yaml
volumes:
  - falkordb_data:/data
```

### Set Resource Limits

Prevent resource exhaustion:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
    reservations:
      cpus: '2'
      memory: 4G
```

### Use Health Checks

Ensure automatic recovery:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Configure Logging

Manage log file sizes:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Separate Concerns

Use different images for different purposes:

- Development: `falkordb/falkordb` (with browser)
- Production: `falkordb/falkordb-server` (server only)

### Use Specific Tags

Pin to specific versions for stability:

```yaml
image: falkordb/falkordb-server:4.0.0
```

## Troubleshooting

### Check Container Logs

```bash
docker-compose logs falkordb
```

### Check Container Status

```bash
docker-compose ps
```

### Test Connection

```bash
docker-compose exec falkordb redis-cli ping
```

### Access Redis CLI

```bash
docker-compose exec falkordb redis-cli
```

### View Running Processes

```bash
docker-compose top
```

### Inspect Configuration

```bash
docker-compose config
```

## Next Steps

- Learn about Persistence for data durability
- Set up Replication for high availability
- Configure a Cluster for scalability
- Review Configuration options
- Deploy to Kubernetes for orchestration

## Frequently Asked Questions

### What is the difference between falkordb/falkordb and falkordb/falkordb-server images?

- The `falkordb/falkordb` image includes both the FalkorDB server and the Browser UI (ports 6379 and 3000). The `falkordb/falkordb-server` image includes only the server (port 6379), making it lighter for production use.

### How do I set a password for FalkorDB in Docker?

- Pass `--requirepass <password>` via the `REDIS_ARGS` environment variable: `-e REDIS_ARGS='--requirepass mypassword'`. For Docker Compose, add it to the `environment` section.

### How do I configure FalkorDB module parameters like thread count?

- Use the `FALKORDB_ARGS` environment variable: `-e FALKORDB_ARGS='THREAD_COUNT 8 CACHE_SIZE 50 TIMEOUT_MAX 60000'`. See the Configuration page for all available parameters.

### Why is my data lost when I restart the container?

- You need to mount a persistent volume. Use `-v falkordb_data:/var/lib/falkordb/data` to attach a Docker volume to the default data directory, and enable AOF for durability.

### How do I check if FalkorDB is healthy in Docker Compose?

- Add a healthcheck using `redis-cli ping`: `test: ['CMD', 'redis-cli', 'ping']`. With authentication, include `-a yourpassword` in the test command.

## Key facts and numbers

- Images (3): `falkordb/falkordb` (ports 6379 + 3000, server + browser), `falkordb/falkordb-server` (port 6379, server only), `falkordb/falkordb-browser` (port 3000, requires `FALKORDB_URL`).
- Ports: `6379` = Redis/FalkorDB server, `3000` = FalkorDB Browser UI. Browser URL in quick start: http://localhost:3000.
- Docker Compose file format version used in every example: `version: '3.8'`.
- Example passwords: `yourpassword` (docker run), `falkordb` (basic and split compose, `${FALKORDB_PASSWORD:-falkordb}`), `changeme` (`${FALKORDB_PASSWORD:-changeme}`), `your-secure-password`, `mypassword` (REDIS_ARGS example).
- Example `FALKORDB_ARGS` values: `THREAD_COUNT 4 TIMEOUT 5000`; `THREAD_COUNT 4`; `THREAD_COUNT 8 TIMEOUT_MAX 30000`; `THREAD_COUNT 4 CACHE_SIZE 25 TIMEOUT_MAX 10000`; `THREAD_COUNT 8 CACHE_SIZE 50 TIMEOUT_MAX 60000 TIMEOUT_DEFAULT 30000 QUERY_MEM_CAPACITY 104857600`.
- Example `REDIS_ARGS` values: `--requirepass mypassword --maxmemory 1gb --appendonly yes`; `--requirepass ${FALKORDB_PASSWORD:-changeme} --appendonly yes --appendfsync everysec --maxmemory 2gb --maxmemory-policy allkeys-lru`.
- Health checks: `interval: 30s`, `timeout: 10s`, `retries: 3` (basic/production), `retries: 5` + `start_period: 30s` (complete production), `start_period: 40s` (generic health-check examples).
- Custom network subnet: `172.25.0.0/16` on the `falkordb-network` bridge driver.
- Resource limits example: cpus `'4'` / memory `8G`; reservations cpus `'2'` / memory `4G`.
- Logging example: driver `"json-file"`, `max-size: "10m"`, `max-file: "3"`.
- Pinned version example tag: `falkordb/falkordb-server:4.0.0`.
- Default data directory (from FAQ): `/var/lib/falkordb/data`.
- Container names used: `falkordb`, `falkordb-server`, `falkordb-browser`, `falkordb-production`.
- Browser → server connection in split setup: `FALKORDB_URL=redis://falkordb-server:6379` with `FALKORDB_PASSWORD=falkordb`.
- `.env` variables used in examples: `FALKORDB_PASSWORD`, `FALKORDB_THREADS=8`.
- Config mount in complete production setup: `./falkordb-config:/etc/falkordb`.
- All services use `restart: unless-stopped`.
- Referenced docs pages for Next Steps: Persistence, Replication, Cluster, Configuration, Kubernetes.

## Code, commands and queries

Consolidated quick reference (full `docker-compose.yml` files appear verbatim in the sections above).

Start FalkorDB with browser (development):

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:latest
```

Start the server only (production):

```bash
docker run -p 6379:6379 -it --rm falkordb/falkordb-server:latest
```

With authentication:

```bash
docker run -p 6379:6379 -p 3000:3000 -it \
  -e REDIS_ARGS="--requirepass yourpassword" \
  --rm falkordb/falkordb:latest
```

With custom FalkorDB module configuration:

```bash
docker run -p 6379:6379 -p 3000:3000 -it \
  -e REDIS_ARGS="--requirepass yourpassword" \
  -e FALKORDB_ARGS="THREAD_COUNT 4 TIMEOUT 5000" \
  --rm falkordb/falkordb:latest
```

Start with a custom Compose password, create a bind-mount directory, and inspect the resolved Compose config:

```bash
FALKORDB_PASSWORD=your-secure-password docker-compose up -d
mkdir -p ./falkordb-data
docker-compose config
```

## Hackathon relevance

- The one-line dev start (`docker run -p 6379:6379 -p 3000:3000 ... falkordb/falkordb:latest`) gives any hackathon build a local graph database plus the Browser UI at http://localhost:3000 in seconds — ideal for the connected-data track.
- Named volumes plus `--appendonly yes` keep agent memory graphs alive across container restarts, which matters for the agent-memory-and-coordination track.
- `REDIS_ARGS` / `FALKORDB_ARGS` tunables (`THREAD_COUNT`, `CACHE_SIZE`, `TIMEOUT_MAX`, `QUERY_MEM_CAPACITY`) let you size the instance when loading a company-brain corpus without touching code.
- The separate server + browser Compose setup matches a typical hack topology: your agent app + `falkordb-server` + `falkordb-browser` for demo walkthroughs.
- Health checks and `restart: unless-stopped` keep the shared context layer alive during live demos where multiple agents read and write the same graph.

## Related notes

- [`docs-getting-started.md`](docs-getting-started.md) — installation overview that this Docker page expands into deployment detail.
- [`docker-image.md`](docker-image.md) — Docker Hub listing for the `falkordb/falkordb` image referenced throughout.
- [`repo-falkordb.md`](repo-falkordb.md) — upstream repository where the ready-to-use `docker-compose.yml` lives.
- [`../../guide/03-run-falkordb.md`](../../guide/03-run-falkordb.md) — guide module that walks through running FalkorDB locally.
