# Vision-TF Backend

Enterprise-grade authentication and security system for Vision-TF platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (Linux) or Docker Desktop (Windows/Mac)
- Git

**Note for Linux users:** If you encounter Docker connection issues, run:
```bash
export DOCKER_HOST=unix:///var/run/docker.sock
```
Or add it to your `~/.bashrc` for permanent fix.

### First Time Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file** with your configuration values

4. **Run setup script:**

   **Option A: Full Setup (Recommended for first time)**
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh --f
   ```
   
   **Option B: Development Mode (Database only)**
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh --dev
   ```

### Setup Modes

**Full Setup (`--f` or `--full`):**
- Starts all containers (PostgreSQL, RabbitMQ, Backend)
- Runs database migrations
- Seeds test data
- Perfect for complete environment setup

**Development Mode (`--dev`):**
- Starts only the database container
- Runs database migrations
- Skips seeding
- Perfect for local development with hot reload
- You can then run `npm run start:dev` locally

The setup script will:
- Check Docker installation
- Start containers based on selected mode
- Run database migrations
- Seed test data (full mode only)
- Show you the service URLs

### Daily Development

**For Full Setup Users:**
```bash
./scripts/dev/dev-start.sh
```

**For Development Mode Users:**
```bash
# Start database (if not running)
./scripts/dev-setup.sh --dev

# Start backend locally with hot reload
npm run start:dev
```

**View logs:**
```bash
./scripts/dev/dev-logs.sh
```

**Stop development environment:**
```bash
./scripts/dev/dev-stop.sh
```

**Reset everything (when things go wrong):**
```bash
./scripts/dev/dev-reset.sh
```

## Troubleshooting

**Check service health:**
```bash
./scripts/utils/health-check.sh
```

**Clean up Docker resources (Vision-TF only):**
```bash
./scripts/utils/cleanup.sh --all
```

**Common issues:**
- Docker not running: Start Docker service (`sudo systemctl start docker`)
- Port conflicts: Stop local PostgreSQL (`sudo systemctl stop postgresql`)
- Permission errors: Use `sudo` for Docker commands on Linux
- Docker connection issues: Set `DOCKER_HOST=unix:///var/run/docker.sock`

## Services

Once running, you'll have access to:

- **API**: http://localhost:${PORT}
- **API Documentation**: http://localhost:${PORT}/api
- **Health Check**: http://localhost:${PORT}/v1/health
- **RabbitMQ Management**: http://localhost:${RABBITMQ_MANAGEMENT_PORT}

## Database Management

**Create backup:**
```bash
./scripts/db/db-backup.sh
```

**Restore from backup:**
```bash
./scripts/db/db-restore.sh ./backups/vision-tf-backup-YYYYMMDD_HHMMSS.sql
```

## Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:${DB_PORT}/your_db_name"

# JWT
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=${PORT}
NODE_ENV=development

# Test users (for seeding)
SEED_ADMIN_EMAIL="your_admin_email@example.com"
SEED_ADMIN_PASSWORD="your_admin_password"
# ... other seed variables
```

## API Endpoints

### Authentication
- `POST /v1/auth/signup` - Register user
- `POST /v1/auth/login` - User login
- `POST /v1/auth/logout` - User logout
- `POST /v1/auth/refresh` - Refresh token

### User Management
- `GET /v1/auth/profile` - Get profile
- `GET /v1/auth/sessions` - Get sessions
- `POST /v1/auth/sessions/terminate` - Terminate session

### Admin
- `GET /v1/auth/admin/users` - List users
- `POST /v1/auth/admin/change-role` - Change user role
- `GET /v1/auth/audit/logs` - View audit logs
- `GET /v1/auth/security/suspicious-activities` - View security events

## Features

- User authentication with JWT
- Role-based access (CLIENT, DEVELOPER, ADMIN)
- Two-factor authentication
- Session management
- Audit logging
- Suspicious activity detection
- Rate limiting
- Health monitoring

## Tech Stack

- NestJS framework
- PostgreSQL database
- Prisma ORM
- JWT authentication
- Docker containerization
- RabbitMQ messaging

## Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test:cov
```

## Scripts Reference

See `scripts/README.md` for detailed script documentation.

## Support

For issues:
1. Check `./scripts/utils/health-check.sh`
2. View logs with `./scripts/dev/dev-logs.sh`
3. Reset environment with `./scripts/dev/dev-reset.sh`
4. Clean up resources with `./scripts/utils/cleanup.sh --all`
5. Contact the development team

## Recent Updates

- ✅ **Fixed Dockerfile.dev**: Resolved "Cannot find module '/app/dist/main'" error
- ✅ **Added setup modes**: `--dev` (database only) and `--f` (full setup)
- ✅ **Improved cleanup script**: Project-specific resource cleanup
- ✅ **Enhanced error handling**: Better Docker connection and build verification
- ✅ **Linux compatibility**: Added Docker host configuration for Linux users
