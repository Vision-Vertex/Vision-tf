#!/bin/bash

# ===========================================
# Development Stop Script
# Stops the development environment cleanly
# ===========================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if containers are running
if ! docker ps --format "table {{.Names}}" | grep -q "vision-tf-backend"; then
    print_warning "No containers are currently running"
    exit 0
fi

print_status "Stopping development environment..."

# Stop containers gracefully
docker-compose down

print_success "Development environment stopped successfully!"

# Check if any containers are still running
if docker ps --format "table {{.Names}}" | grep -q "vision-tf"; then
    print_warning "Some containers are still running. Force stopping..."
    docker-compose down --remove-orphans
    print_success "All containers stopped"
fi

echo
echo -e "${GREEN}✅ Development environment stopped!${NC}"
echo -e "${YELLOW}💡 Use './scripts/dev/dev-start.sh' to start again${NC}"
