# Vision-TF Automation Scripts

This directory contains automation scripts to make development and deployment easier.

## 📁 Directory Structure

```
scripts/
├── dev-setup.sh          # Complete development environment setup
├── setup-db.sh           # Database setup and seeding
├── dev/                  # Development workflow scripts
│   ├── dev-start.sh      # Quick start development environment
│   ├── dev-stop.sh       # Stop development environment
│   ├── dev-logs.sh       # View container logs
│   └── dev-reset.sh      # Reset entire development environment
├── db/                   # Database management scripts
│   ├── db-backup.sh      # Create database backups
│   └── db-restore.sh     # Restore from backup
└── utils/                # Utility scripts
    ├── health-check.sh   # Check all services health
    └── cleanup.sh        # Clean up Docker resources
```

## 🚀 Quick Start

### For New Developers

1. **Clone the repository**
2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```
3. **Edit `.env` file** with your configuration
4. **Run the complete setup:**
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh
   ```

### For Daily Development

```bash
# Start development environment
./scripts/dev/dev-start.sh

# View logs
./scripts/dev/dev-logs.sh

# Stop development environment
./scripts/dev/dev-stop.sh

# Reset everything (when things go wrong)
./scripts/dev/dev-reset.sh
```

## 📋 Script Details

### Development Setup

#### `dev-setup.sh`
Complete setup script for new developers.

**Features:**
- ✅ Detects operating system (Windows/Linux/macOS)
- ✅ Checks Docker installation and status
- ✅ Creates `.env` file from template
- ✅ Starts all containers
- ✅ Waits for services to be ready
- ✅ Runs database setup and seeding
- ✅ Shows final status and URLs

**Usage:**
```bash
./scripts/dev-setup.sh
```

### Development Workflow

#### `dev/dev-start.sh`
Quick start for daily development.

**Features:**
- ✅ Checks if containers are already running
- ✅ Starts containers with `docker-compose up -d`
- ✅ Verifies API is responding
- ✅ Shows service URLs

**Usage:**
```bash
./scripts/dev/dev-start.sh
```

#### `dev/dev-stop.sh`
Clean shutdown of development environment.

**Features:**
- ✅ Stops all containers gracefully
- ✅ Removes orphaned containers
- ✅ Shows helpful restart instructions

**Usage:**
```bash
./scripts/dev/dev-stop.sh
```

#### `dev/dev-logs.sh`
View container logs with options.

**Features:**
- ✅ View all container logs
- ✅ Follow logs in real-time
- ✅ View logs for specific service
- ✅ Helpful command-line options

**Usage:**
```bash
# View all logs
./scripts/dev/dev-logs.sh

# Follow all logs
./scripts/dev/dev-logs.sh -f

# View backend logs only
./scripts/dev/dev-logs.sh -s backend

# Follow backend logs
./scripts/dev/dev-logs.sh -s backend -f

# Show help
./scripts/dev/dev-logs.sh -h
```

#### `dev/dev-reset.sh`
Complete reset of development environment.

**Features:**
- ✅ Confirms destructive actions
- ✅ Stops and removes all containers
- ✅ Removes volumes (database data)
- ✅ Removes images
- ✅ Cleans up Docker resources
- ✅ Option to start fresh

**Usage:**
```bash
./scripts/dev/dev-reset.sh
```

### Database Management

#### `db/db-backup.sh`
Create timestamped database backups.

**Features:**
- ✅ Creates timestamped backup files
- ✅ Shows backup details (file, size, time)
- ✅ Lists recent backups
- ✅ Shows restore command

**Usage:**
```bash
./scripts/db/db-backup.sh
```

#### `db/db-restore.sh`
Restore database from backup.

**Features:**
- ✅ Validates backup file exists
- ✅ Confirms destructive restore
- ✅ Stops backend during restore
- ✅ Drops and recreates database
- ✅ Restarts backend after restore
- ✅ Waits for services to be ready

**Usage:**
```bash
./scripts/db/db-restore.sh ./backups/vision-tf-backup-20250807_143022.sql
```

### Utilities

#### `utils/health-check.sh`
Comprehensive health check for all services.

**Features:**
- ✅ Checks Docker status
- ✅ Verifies all containers are running
- ✅ Tests database connectivity
- ✅ Checks API health endpoint
- ✅ Verifies RabbitMQ management
- ✅ Checks port availability
- ✅ Provides troubleshooting tips

**Usage:**
```bash
./scripts/utils/health-check.sh
```

#### `utils/cleanup.sh`
Clean up Docker resources.

**Features:**
- ✅ Remove containers only
- ✅ Remove containers and volumes
- ✅ Remove containers and images
- ✅ Remove everything (containers, volumes, images)
- ✅ Confirms destructive actions
- ✅ Cleans up dangling resources

**Usage:**
```bash
# Remove containers only
./scripts/utils/cleanup.sh

# Remove containers and volumes
./scripts/utils/cleanup.sh --volumes

# Remove containers and images
./scripts/utils/cleanup.sh --images

# Remove everything
./scripts/utils/cleanup.sh --all

# Show help
./scripts/utils/cleanup.sh -h
```

## 🔧 Cross-Platform Compatibility

### Windows Users
All scripts work on Windows through Docker. The scripts detect the operating system and provide appropriate instructions.

**Windows Workflow:**
```bash
# Start containers
docker-compose up -d

# Run setup inside container
docker exec vision-tf-backend ./scripts/setup-db.sh

# View logs
docker logs vision-tf-backend
```

### Linux/macOS Users
Scripts work natively on Linux and macOS.

**Linux/macOS Workflow:**
```bash
# Complete setup
./scripts/dev-setup.sh

# Daily development
./scripts/dev/dev-start.sh
./scripts/dev/dev-logs.sh
./scripts/dev/dev-stop.sh
```

## 🎯 Common Workflows

### Daily Development
```bash
# Start development
./scripts/dev/dev-start.sh

# View logs (if needed)
./scripts/dev/dev-logs.sh -f

# Stop when done
./scripts/dev/dev-stop.sh
```

### Troubleshooting
```bash
# Check what's wrong
./scripts/utils/health-check.sh

# View logs for debugging
./scripts/dev/dev-logs.sh -s backend

# Reset everything if needed
./scripts/dev/dev-reset.sh
```

### Database Management
```bash
# Create backup
./scripts/db/db-backup.sh

# Restore from backup
./scripts/db/db-restore.sh ./backups/vision-tf-backup-20250807_143022.sql
```

### Cleanup
```bash
# Remove containers only
./scripts/utils/cleanup.sh

# Remove everything (fresh start)
./scripts/utils/cleanup.sh --all
```

## 🚨 Important Notes

1. **Database Data**: Using `--volumes` or `--all` with cleanup scripts will **permanently delete** your database data.
2. **Environment Variables**: Always edit `.env` file before running setup scripts.
3. **Docker Permissions**: On Linux, you may need to use `sudo` for Docker commands.
4. **Windows**: Use Docker Desktop and run commands in WSL2 or Git Bash for best compatibility.

## 🆘 Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker
   sudo systemctl start docker  # Linux
   # Or start Docker Desktop on Windows/macOS
   ```

2. **Permission denied**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh scripts/*/*.sh
   ```

3. **Port conflicts**
   ```bash
   # Check what's using the port
   sudo lsof -i :${PORT}
   
   # Stop conflicting service
   sudo systemctl stop postgresql  # if local PostgreSQL is running
   ```

4. **Container won't start**
   ```bash
   # Check logs
   ./scripts/dev/dev-logs.sh -s backend
   
   # Reset everything
   ./scripts/dev/dev-reset.sh
   ```

### Getting Help

- Check the main project README for more information
- Use `./scripts/utils/health-check.sh` to diagnose issues
- View logs with `./scripts/dev/dev-logs.sh`
- Reset environment with `./scripts/dev/dev-reset.sh`
