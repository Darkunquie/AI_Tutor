#!/bin/bash

################################################################################
# Database Backup Script
#
# This script creates timestamped backups of the SQLite database and manages
# backup retention (keeps last 7 backups by default).
#
# Prerequisites:
#   - SQLite database file exists at prisma/dev.db
#   - tar command available (standard on Linux/Unix)
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
DB_PATH="prisma/dev.db"
RETENTION_DAYS=7  # Keep backups for 7 days
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="db-backup-${TIMESTAMP}.tar.gz"

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
    echo -e "${BLUE}ℹ $1${NC}"
}

echo "=========================================="
echo "💾 Database Backup Starting"
echo "=========================================="
echo ""

# Step 1: Check if database exists
print_info "Checking database file..."

if [ ! -f "$DB_PATH" ]; then
    print_error "Database file not found at: $DB_PATH"
    exit 1
fi

DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
print_success "Database found: $DB_PATH (Size: $DB_SIZE)"
echo ""

# Step 2: Create backup directory if it doesn't exist
print_info "Preparing backup directory..."

mkdir -p "$BACKUP_DIR"
print_success "Backup directory ready: $BACKUP_DIR"
echo ""

# Step 3: Create backup
print_info "Creating backup..."

# Create a compressed archive of the database
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" "$DB_PATH"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
    print_success "Backup created: ${BACKUP_NAME} (Size: ${BACKUP_SIZE})"
else
    print_error "Backup creation failed"
    exit 1
fi
echo ""

# Step 4: Verify backup integrity
print_info "Verifying backup integrity..."

if tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}" > /dev/null 2>&1; then
    print_success "Backup integrity verified"
else
    print_error "Backup integrity check failed"
    exit 1
fi
echo ""

# Step 5: Clean up old backups (keep only last 7)
print_info "Cleaning up old backups (keeping last ${RETENTION_DAYS})..."

# Count backups before cleanup
BACKUP_COUNT_BEFORE=$(ls -1 "${BACKUP_DIR}"/db-backup-*.tar.gz 2>/dev/null | wc -l)

# Delete backups older than RETENTION_DAYS
find "${BACKUP_DIR}" -name "db-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count backups after cleanup
BACKUP_COUNT_AFTER=$(ls -1 "${BACKUP_DIR}"/db-backup-*.tar.gz 2>/dev/null | wc -l)
DELETED_COUNT=$((BACKUP_COUNT_BEFORE - BACKUP_COUNT_AFTER))

if [ $DELETED_COUNT -gt 0 ]; then
    print_success "Deleted ${DELETED_COUNT} old backup(s)"
else
    print_info "No old backups to delete"
fi

print_success "Current backup count: ${BACKUP_COUNT_AFTER}"
echo ""

# Step 6: Display backup summary
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
ls -lht "${BACKUP_DIR}"/db-backup-*.tar.gz | head -5
echo ""

# Step 7: Restore instructions
print_info "To restore this backup, run:"
echo "  tar -xzf ${BACKUP_DIR}/${BACKUP_NAME}"
echo "  # This will extract to: ${DB_PATH}"
echo ""

# Step 8: Disk space check
print_info "Disk space status:"
df -h "${BACKUP_DIR}" | tail -1
echo ""

print_success "Backup complete!"
