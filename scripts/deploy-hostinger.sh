#!/bin/bash

################################################################################
# Hostinger VPS Deployment Script
#
# This script automates deployment of the Talkivo application
# on a Hostinger VPS with Node.js support.
#
# Prerequisites:
#   - Node.js 18+ installed on the server
#   - PM2 installed globally: npm install -g pm2
#   - Git repository cloned to server
#   - .env file configured with production values
#
# Usage:
#   chmod +x scripts/deploy-hostinger.sh
#   ./scripts/deploy-hostinger.sh
#
# Or run remotely via SSH:
#   ssh user@your-server 'cd /path/to/talkivo && ./scripts/deploy-hostinger.sh'
################################################################################

set -e  # Exit on any error

echo "=========================================="
echo "🚀 Talkivo - Deployment Starting"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js installed: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm installed: $NPM_VERSION"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 installed successfully"
else
    PM2_VERSION=$(pm2 -v)
    print_success "PM2 installed: $PM2_VERSION"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found! Please create .env with production values."
    print_info "Copy .env.example to .env and fill in the values:"
    print_info "  cp .env.example .env"
    print_info "  nano .env"
    exit 1
fi

print_success ".env file found"
echo ""

# Step 2: Pull latest code from git
echo "Step 2: Pulling latest code from git..."

if [ -d .git ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Current branch: $BRANCH"

    git fetch origin
    git pull origin $BRANCH

    COMMIT=$(git rev-parse --short HEAD)
    print_success "Code updated to commit: $COMMIT"
else
    print_warning "Not a git repository. Skipping git pull."
fi
echo ""

# Step 3: Install dependencies
echo "Step 3: Installing dependencies..."

npm install --production=false
print_success "Dependencies installed"
echo ""

# Step 4: Run tests
echo "Step 4: Running tests..."

if npm run test -- --run; then
    print_success "All tests passed"
else
    print_error "Tests failed! Deployment aborted."
    exit 1
fi
echo ""

# Step 5: Generate Prisma client (must run before build)
echo "Step 5: Generating Prisma client..."

npx prisma generate
print_success "Prisma client generated"
echo ""

# Step 6: Build application
echo "Step 6: Building application..."

npm run build
print_success "Build completed successfully"
echo ""

# Step 7: Create database backup (before schema changes)
echo "Step 7: Creating database backup..."

if [ -f scripts/backup-database.sh ]; then
    chmod +x scripts/backup-database.sh
    ./scripts/backup-database.sh
    print_success "Database backup created"
else
    print_warning "Backup script not found. Skipping backup."
fi
echo ""

# Step 8: Push database schema changes
echo "Step 8: Pushing database schema..."

npx prisma db push
print_success "Database schema updated"
echo ""

# Step 9: Restart application with PM2
echo "Step 9: Restarting application..."

if pm2 list | grep -q "talkivo"; then
    print_info "Application is running. Restarting..."
    pm2 restart ecosystem.config.js
    print_success "Application restarted"
else
    print_info "Application not running. Starting..."
    pm2 start ecosystem.config.js
    print_success "Application started"
fi

# Save PM2 process list
pm2 save

print_success "PM2 process list saved"
echo ""

# Step 10: Display application status
echo "Step 10: Checking application status..."

pm2 status
echo ""

pm2 logs talkivo --lines 20 --nostream
echo ""

# Step 11: Health check
echo "Step 11: Performing health check..."

sleep 5  # Wait for app to start

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Health check passed - Application is responding"
else
    print_warning "Health check warning - Application may not be responding correctly"
    print_info "Check logs with: pm2 logs talkivo"
fi
echo ""

# Deployment summary
echo "=========================================="
echo "✓ Deployment Completed Successfully!"
echo "=========================================="
echo ""
print_info "Application: Talkivo"
print_info "Status: $(pm2 jlist | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)"
print_info "Port: 3000"
print_info "Environment: $(grep NODE_ENV .env | cut -d'=' -f2)"
echo ""
print_info "Useful commands:"
echo "  - View logs:     pm2 logs talkivo"
echo "  - Restart app:   pm2 restart talkivo"
echo "  - Stop app:      pm2 stop talkivo"
echo "  - Monitor app:   pm2 monit"
echo "  - App status:    pm2 status"
echo ""
print_success "Deployment complete!"
