#!/bin/bash

# ===========================================
# Development Reset Script
# Resets the entire development environment
# ===========================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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

# Confirm reset
print_header "Development Environment Reset"
print_warning "This will completely reset your development environment!"
echo
print_status "This will:"
echo "  • Stop all containers"
echo "  • Remove all containers"
echo "  • Remove all volumes (database data will be lost!)"
echo "  • Remove all images"
echo "  • Start fresh with new containers"
echo

read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Reset cancelled"
    exit 0
fi

print_status "Starting development environment reset..."

# Stop and remove containers
print_status "Stopping containers..."
docker-compose down --remove-orphans

# Remove volumes
print_status "Removing volumes..."
docker volume rm vision-tf_postgres_data vision-tf_rabbitmq_data 2>/dev/null || true

# Remove images
print_status "Removing images..."
docker rmi vision-tf-backend 2>/dev/null || true

# Clean up any dangling resources
print_status "Cleaning up..."
docker system prune -f

print_success "Reset completed!"

# Ask if user wants to start fresh
echo
read -p "Do you want to start the development environment now? (yes/no): " -r
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Starting fresh development environment..."
    ./scripts/dev/dev-start.sh
else
    print_status "Use './scripts/dev/dev-start.sh' to start the development environment"
fi
