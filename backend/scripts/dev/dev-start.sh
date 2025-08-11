#!/bin/bash

# ===========================================
# Quick Development Start Script
# Starts the development environment quickly
# ===========================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if containers are already running
if docker ps --format "table {{.Names}}" | grep -q "vision-tf-backend"; then
    print_warning "Containers are already running!"
    print_status "Use './scripts/dev/dev-logs.sh' to view logs"
    print_status "Use './scripts/dev/dev-stop.sh' to stop services"
    exit 0
fi

print_status "Starting development environment..."

# Start containers
docker-compose up -d

print_success "Containers started successfully!"

# Wait a moment for services to initialize
sleep 3

# Check if API is responding
if curl -f http://localhost:${PORT}/v1/health > /dev/null 2>&1; then
    print_success "API is ready!"
    echo
    echo -e "${GREEN}🚀 Development environment is ready!${NC}"
    echo -e "   API: ${BLUE}http://localhost:${PORT}${NC}"
    echo -e "   Docs: ${BLUE}http://localhost:${PORT}/api${NC}"
    echo -e "   Health: ${BLUE}http://localhost:${PORT}/v1/health${NC}"
    echo
    echo -e "${YELLOW}💡 Use './scripts/dev/dev-logs.sh' to view logs${NC}"
else
    print_warning "API is starting up..."
    print_status "Use './scripts/dev/dev-logs.sh' to monitor startup progress"
fi
