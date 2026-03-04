#!/bin/bash

################################################################################
# Database Backup Script (PostgreSQL / Neon)
#
# Creates a timestamped pg_dump backup and manages retention (7 days default).
#
# Prerequisites:
#   - DATABASE_URL environment variable set (postgres:// connection string)
#   - pg_dump available (postgresql-client package)
#
# Usage:
#   chmod +x scripts/backup-database.sh
#   ./scripts/backup-database.sh
#
# Automated Daily Backups (crontab):
#   crontab -e
#   Add line: 0 2 * * * cd /path/to/talkivo && ./scripts/backup-database.sh
#   (Runs daily at 2:00 AM)
################################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${HOME}/backups/talkivo"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="db-backup-${TIMESTAMP}.sql.gz"

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }

echo "=========================================="
echo "💾 Database Backup Starting"
echo "=========================================="
echo ""

# Step 1: Verify DATABASE_URL is set
print_info "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    # Try loading from .env
    if [ -f ".env" ]; then
        export "$(grep -v '^#' .env | grep 'DATABASE_URL' | xargs)"
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is not set. Export it or add it to .env"
    exit 1
fi
print_success "DATABASE_URL found"
echo ""

# Step 2: Verify pg_dump is available
print_info "Checking pg_dump..."
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump not found. Install postgresql-client: apt-get install postgresql-client"
    exit 1
fi
print_success "pg_dump available: $(pg_dump --version | head -1)"
echo ""

# Step 3: Create backup directory
print_info "Preparing backup directory..."
mkdir -p "$BACKUP_DIR"
print_success "Backup directory ready: $BACKUP_DIR"
echo ""

# Step 4: Run pg_dump and compress output
print_info "Creating backup..."
pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${BACKUP_NAME}"
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
print_success "Backup created: ${BACKUP_NAME} (Size: ${BACKUP_SIZE})"
echo ""

# Step 5: Verify backup integrity
print_info "Verifying backup integrity..."
if gzip -t "${BACKUP_DIR}/${BACKUP_NAME}" 2>/dev/null; then
    print_success "Backup integrity verified"
else
    print_error "Backup integrity check failed"
    exit 1
fi
echo ""

# Step 6: Clean up old backups (keep only last RETENTION_DAYS days)
print_info "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
BACKUP_COUNT_BEFORE=$(ls -1 "${BACKUP_DIR}"/db-backup-*.sql.gz 2>/dev/null | wc -l)
find "${BACKUP_DIR}" -name "db-backup-*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
BACKUP_COUNT_AFTER=$(ls -1 "${BACKUP_DIR}"/db-backup-*.sql.gz 2>/dev/null | wc -l)
DELETED_COUNT=$((BACKUP_COUNT_BEFORE - BACKUP_COUNT_AFTER))

if [ "$DELETED_COUNT" -gt 0 ]; then
    print_success "Deleted ${DELETED_COUNT} old backup(s)"
else
    print_info "No old backups to delete"
fi
print_success "Current backup count: ${BACKUP_COUNT_AFTER}"
echo ""

# Step 7: Display backup summary
echo "=========================================="
echo "✓ Backup Completed Successfully!"
echo "=========================================="
echo ""
print_info "Backup Details:"
echo "  - File:      ${BACKUP_NAME}"
echo "  - Location:  ${BACKUP_DIR}"
echo "  - Size:      ${BACKUP_SIZE}"
echo "  - Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
print_info "Recent Backups:"
ls -lht "${BACKUP_DIR}"/db-backup-*.sql.gz 2>/dev/null | head -5
echo ""

# Step 8: Restore instructions
print_info "To restore this backup, run:"
echo "  gunzip -c ${BACKUP_DIR}/${BACKUP_NAME} | psql \"\$DATABASE_URL\""
echo ""

# Step 9: Disk space check
print_info "Disk space status:"
df -h "${BACKUP_DIR}" | tail -1
echo ""

print_success "Backup complete!"
