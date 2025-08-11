#!/bin/bash

# ===========================================
# Development Logs Script
# Shows logs from all containers in a readable format
# ===========================================

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

# Check if containers are running
if ! docker ps --format "table {{.Names}}" | grep -q "vision-tf-backend"; then
    print_error "No containers are currently running"
    print_status "Use './scripts/dev/dev-start.sh' to start the development environment"
    exit 1
fi

# Parse command line arguments
FOLLOW=false
SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  -f, --follow     Follow log output (like tail -f)"
            echo "  -s, --service    Show logs for specific service (backend, postgres, rabbitmq)"
            echo "  -h, --help       Show this help message"
            echo
            echo "Examples:"
            echo "  $0                    # Show all logs"
            echo "  $0 -f                 # Follow all logs"
            echo "  $0 -s backend         # Show only backend logs"
            echo "  $0 -s backend -f      # Follow backend logs"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Show logs based on options
if [ -n "$SERVICE" ]; then
    # Show logs for specific service
    case $SERVICE in
        backend)
            print_header "Backend Logs"
            if [ "$FOLLOW" = true ]; then
                docker logs -f vision-tf-backend
            else
                docker logs vision-tf-backend
            fi
            ;;
        postgres|db)
            print_header "PostgreSQL Logs"
            if [ "$FOLLOW" = true ]; then
                docker logs -f vision-tf-db
            else
                docker logs vision-tf-db
            fi
            ;;
        rabbitmq)
            print_header "RabbitMQ Logs"
            if [ "$FOLLOW" = true ]; then
                docker logs -f vision-tf-rabbitmq
            else
                docker logs vision-tf-rabbitmq
            fi
            ;;
        *)
            print_error "Unknown service: $SERVICE"
            print_status "Available services: backend, postgres, rabbitmq"
            exit 1
            ;;
    esac
else
    # Show all logs
    print_header "All Container Logs"
    print_status "Press Ctrl+C to stop following logs"
    echo
    
    if [ "$FOLLOW" = true ]; then
        docker-compose logs -f
    else
        docker-compose logs
    fi
fi
