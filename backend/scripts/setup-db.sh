#!/bin/bash

# ===========================================
# Database Setup Script for Vision-TF Backend
# ===========================================

set -e

echo "🚀 Starting database setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're running in Docker
if [ -f /.dockerenv ]; then
    print_status "Running inside Docker container"
    DOCKER_MODE=true
else
    print_status "Running on host machine"
    DOCKER_MODE=false
fi

# Function to wait for database to be ready
wait_for_database() {
    print_status "Waiting for database to be ready..."
    
    if [ "$DOCKER_MODE" = true ]; then
        # Inside Docker, wait for postgres service
        until npx prisma db push --accept-data-loss; do
            print_warning "Database not ready, retrying in 5 seconds..."
            sleep 5
        done
    else
        # On host, wait for local postgres
        until pg_isready -h localhost -p ${DB_PORT} -U ${POSTGRES_USER}; do
            print_warning "Database not ready, retrying in 5 seconds..."
            sleep 5
        done
    fi
    
    print_success "Database is ready!"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if [ "$DOCKER_MODE" = true ]; then
        # Inside Docker container
        npx prisma migrate deploy
    else
        # On host machine
        npx prisma db push
    fi
    
    print_success "Database migrations completed!"
}

# Function to generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated!"
}

# Function to seed database (if seed script exists)
seed_database() {
  if [ -f "prisma/seed.ts" ]; then
    print_status "Seeding database via API..."
    print_status "This will create test users using the actual signup endpoints"
    
    # Check if we're in Docker and API is running
    if [ "$DOCKER_MODE" = true ]; then
      print_status "Running in Docker - seeding will be handled by the container startup"
      print_warning "Seeding is disabled in Docker mode for security"
    else
      print_status "Running on host - seeding database..."
      npx ts-node prisma/seed.ts
      print_success "Database seeded!"
    fi
  else
    print_warning "No seed script found at prisma/seed.ts"
  fi
}

# Function to verify database connection
verify_connection() {
    print_status "Verifying database connection..."
    
    if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection verified!"
    else
        print_error "Failed to verify database connection"
        exit 1
    fi
}

# Main execution
main() {
    print_status "Starting Vision-TF database setup..."
    
    # Wait for database
    wait_for_database
    
    # Generate Prisma client
    generate_prisma_client
    
    # Run migrations
    run_migrations
    
    # Seed database (if available)
    seed_database
    
    # Verify connection
    verify_connection
    
    print_success "Database setup completed successfully! 🎉"
}

# Run main function
main "$@"
