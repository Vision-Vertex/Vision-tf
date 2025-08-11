#!/bin/bash

# ===========================================
# Vision-TF Docker Cleanup Utility Script
# Cleans up Docker resources specific to this project
# ===========================================

set -e

# Project-specific identifiers
PROJECT_NAME="vision-tf"
PROJECT_PREFIX="vision-tf-"

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

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Vision-TF Project Docker Cleanup Utility"
    echo "Removes Docker resources specific to this project only"
    echo
    echo "Options:"
    echo "  -c, --containers    Remove project containers"
    echo "  -v, --volumes       Remove project volumes"
    echo "  -i, --images        Remove project images"
    echo "  -n, --networks      Remove project networks"
    echo "  -a, --all           Remove all project resources"
    echo "  -f, --force         Force removal without confirmation"
    echo "  -h, --help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0 -c                    # Remove project containers only"
    echo "  $0 -v -i                 # Remove project volumes and images"
    echo "  $0 -a -f                 # Remove all project resources without confirmation"
    echo "  $0 --all                 # Remove all project resources with confirmation"
}

# Count resources safely
count_resources() {
    local resources="$1"
    if [ -z "$resources" ]; then
        echo "0"
    else
        echo "$resources" | wc -l
    fi
}

cleanup_project_containers() {
    print_status "Cleaning up Vision-TF project containers..."
    
    # Find containers with project prefix
    local containers=$(docker ps -a --filter "name=${PROJECT_PREFIX}" --format "{{.Names}}" 2>/dev/null || echo "")
    local count=$(count_resources "$containers")
    
    if [ "$count" -eq 0 ]; then
        print_success "No Vision-TF project containers found"
        return
    fi
    
    if [ "$FORCE" = true ]; then
        docker ps -a --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker rm -f
        print_success "Removed $count Vision-TF project containers"
    else
        print_warning "Found $count Vision-TF project containers:"
        echo "$containers"
        echo
        read -p "Remove these containers? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker ps -a --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker rm -f
            print_success "Removed Vision-TF project containers"
        else
            print_status "Skipped container cleanup"
        fi
    fi
}

cleanup_project_volumes() {
    print_status "Cleaning up Vision-TF project volumes..."
    
    # Find volumes with project prefix
    local volumes=$(docker volume ls --filter "name=${PROJECT_PREFIX}" --format "{{.Name}}" 2>/dev/null || echo "")
    local count=$(count_resources "$volumes")
    
    if [ "$count" -eq 0 ]; then
        print_success "No Vision-TF project volumes found"
        return
    fi
    
    if [ "$FORCE" = true ]; then
        docker volume ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker volume rm
        print_success "Removed $count Vision-TF project volumes"
    else
        print_warning "Found $count Vision-TF project volumes:"
        echo "$volumes"
        echo
        read -p "Remove these volumes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker volume ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker volume rm
            print_success "Removed Vision-TF project volumes"
        else
            print_status "Skipped volume cleanup"
        fi
    fi
}

cleanup_project_images() {
    print_status "Cleaning up Vision-TF project images..."
    
    # Find images related to the project
    local images=$(docker images --filter "reference=*${PROJECT_NAME}*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || echo "")
    local count=$(count_resources "$images")
    
    if [ "$count" -eq 0 ]; then
        print_success "No Vision-TF project images found"
        return
    fi
    
    if [ "$FORCE" = true ]; then
        docker images --filter "reference=*${PROJECT_NAME}*" -q | xargs -r docker rmi -f
        print_success "Removed $count Vision-TF project images"
    else
        print_warning "Found $count Vision-TF project images:"
        echo "$images"
        echo
        read -p "Remove these images? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker images --filter "reference=*${PROJECT_NAME}*" -q | xargs -r docker rmi -f
            print_success "Removed Vision-TF project images"
        else
            print_status "Skipped image cleanup"
        fi
    fi
}

cleanup_project_networks() {
    print_status "Cleaning up Vision-TF project networks..."
    
    # Find networks with project prefix
    local networks=$(docker network ls --filter "name=${PROJECT_PREFIX}" --format "{{.Name}}" 2>/dev/null || echo "")
    local count=$(count_resources "$networks")
    
    if [ "$count" -eq 0 ]; then
        print_success "No Vision-TF project networks found"
        return
    fi
    
    if [ "$FORCE" = true ]; then
        docker network ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker network rm
        print_success "Removed $count Vision-TF project networks"
    else
        print_warning "Found $count Vision-TF project networks:"
        echo "$networks"
        echo
        read -p "Remove these networks? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker network ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker network rm
            print_success "Removed Vision-TF project networks"
        else
            print_status "Skipped network cleanup"
        fi
    fi
}

cleanup_all_project_resources() {
    print_status "Cleaning up all Vision-TF project resources..."
    
    # Get all resources
    local containers=$(docker ps -a --filter "name=${PROJECT_PREFIX}" --format "{{.Names}}" 2>/dev/null || echo "")
    local volumes=$(docker volume ls --filter "name=${PROJECT_PREFIX}" --format "{{.Name}}" 2>/dev/null || echo "")
    local images=$(docker images --filter "reference=*${PROJECT_NAME}*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || echo "")
    local networks=$(docker network ls --filter "name=${PROJECT_PREFIX}" --format "{{.Name}}" 2>/dev/null || echo "")
    
    # Count resources safely
    local container_count=$(count_resources "$containers")
    local volume_count=$(count_resources "$volumes")
    local image_count=$(count_resources "$images")
    local network_count=$(count_resources "$networks")
    
    # Calculate total
    local total_count=$((container_count + volume_count + image_count + network_count))
    
    if [ "$total_count" -eq 0 ]; then
        print_success "No Vision-TF project resources found"
        return
    fi
    
    if [ "$FORCE" = true ]; then
        print_warning "Removing all Vision-TF project resources without confirmation..."
        docker ps -a --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker rm -f
        docker volume ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker volume rm
        docker images --filter "reference=*${PROJECT_NAME}*" -q | xargs -r docker rmi -f
        docker network ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker network rm
        print_success "Removed all Vision-TF project resources"
    else
        print_warning "Found Vision-TF project resources:"
        if [ "$container_count" -gt 0 ]; then
            echo "Containers ($container_count):"
            echo "$containers"
            echo
        fi
        if [ "$volume_count" -gt 0 ]; then
            echo "Volumes ($volume_count):"
            echo "$volumes"
            echo
        fi
        if [ "$image_count" -gt 0 ]; then
            echo "Images ($image_count):"
            echo "$images"
            echo
        fi
        if [ "$network_count" -gt 0 ]; then
            echo "Networks ($network_count):"
            echo "$networks"
            echo
        fi
        
        read -p "Remove all these Vision-TF project resources? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker ps -a --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker rm -f
            docker volume ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker volume rm
            docker images --filter "reference=*${PROJECT_NAME}*" -q | xargs -r docker rmi -f
            docker network ls --filter "name=${PROJECT_PREFIX}" -q | xargs -r docker network rm
            print_success "Removed all Vision-TF project resources"
        else
            print_status "Skipped cleanup"
        fi
    fi
}

show_project_resources() {
    print_status "Vision-TF Project Docker Resources:"
    echo
    
    echo "Containers:"
    local containers=$(docker ps -a --filter "name=${PROJECT_PREFIX}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "")
    if [ -z "$containers" ]; then
        echo "  No project containers found"
    else
        echo "$containers"
    fi
    echo
    
    echo "Images:"
    local images=$(docker images --filter "reference=*${PROJECT_NAME}*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null || echo "")
    if [ -z "$images" ]; then
        echo "  No project images found"
    else
        echo "$images"
    fi
    echo
    
    echo "Volumes:"
    local volumes=$(docker volume ls --filter "name=${PROJECT_PREFIX}" --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null || echo "")
    if [ -z "$volumes" ]; then
        echo "  No project volumes found"
    else
        echo "$volumes"
    fi
    echo
    
    echo "Networks:"
    local networks=$(docker network ls --filter "name=${PROJECT_PREFIX}" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" 2>/dev/null || echo "")
    if [ -z "$networks" ]; then
        echo "  No project networks found"
    else
        echo "$networks"
    fi
    echo
    
    # Show disk usage for project resources
    print_status "Project resource disk usage:"
    docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}" 2>/dev/null || echo "Unable to get disk usage information"
}

# Parse command line arguments
CONTAINERS=false
VOLUMES=false
IMAGES=false
NETWORKS=false
ALL=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--containers)
            CONTAINERS=true
            shift
            ;;
        -v|--volumes)
            VOLUMES=true
            shift
            ;;
        -i|--images)
            IMAGES=true
            shift
            ;;
        -n|--networks)
            NETWORKS=true
            shift
            ;;
        -a|--all)
            ALL=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running or not accessible"
    exit 1
fi

# If no options specified, show project resources
if [ "$CONTAINERS" = false ] && [ "$VOLUMES" = false ] && [ "$IMAGES" = false ] && [ "$NETWORKS" = false ] && [ "$ALL" = false ]; then
    print_status "No cleanup options specified. Showing Vision-TF project resources:"
    show_project_resources
    echo
    show_help
    exit 0
fi

# Perform cleanup based on options
if [ "$ALL" = true ]; then
    cleanup_all_project_resources
else
    if [ "$CONTAINERS" = true ]; then
        cleanup_project_containers
    fi
    
    if [ "$VOLUMES" = true ]; then
        cleanup_project_volumes
    fi
    
    if [ "$IMAGES" = true ]; then
        cleanup_project_images
    fi
    
    if [ "$NETWORKS" = true ]; then
        cleanup_project_networks
    fi
fi

print_success "Vision-TF project cleanup completed!"
