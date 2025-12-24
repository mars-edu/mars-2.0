#!/bin/bash

# Universal Convex Migration Runner
# This script runs all migrations in the convex/migrations folder in order

# Note: Don't use 'set -e' here because we want to handle errors gracefully

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_DIR="convex/migrations"
LOG_FILE="migrations.log"

# Print with color
print_info() {
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

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Main function
main() {
    print_info "Starting Convex migrations..."
    log "=== Migration run started ==="

    # Check if migrations directory exists
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_warning "Migrations directory not found: $MIGRATIONS_DIR"
        print_info "Creating migrations directory..."
        mkdir -p "$MIGRATIONS_DIR"
        log "Created migrations directory"
        print_success "No migrations to run"
        return 0
    fi

    # Find all .txt migration files and sort them
    migration_files=$(find "$MIGRATIONS_DIR" -name "*.txt" -type f | sort)

    # Check if there are any migrations
    if [ -z "$migration_files" ]; then
        print_info "No migration files found in $MIGRATIONS_DIR"
        log "No migrations to run"
        print_success "Migrations check complete"
        return 0
    fi

    # Count migrations
    migration_count=$(echo "$migration_files" | wc -l)
    print_info "Found $migration_count migration(s) to run"
    log "Found $migration_count migrations"

    # Run each migration
    success_count=0
    error_count=0

    while IFS= read -r migration_file; do
        # Get migration name
        migration_name=$(basename "$migration_file" .txt)

        print_info "Running migration: $migration_name"
        log "Running migration: $migration_name"

        # Read the Convex function path from the file
        if [ ! -f "$migration_file" ]; then
            print_error "Migration file not found: $migration_file"
            log "ERROR: Migration file not found: $migration_file"
            error_count=$((error_count + 1))
            continue
        fi

        convex_function=$(cat "$migration_file" | head -n 1 | tr -d '\n' | tr -d '\r')

        # Validate that we got a function path
        if [ -z "$convex_function" ]; then
            print_error "Empty migration file: $migration_file"
            log "ERROR: Empty migration file: $migration_file"
            error_count=$((error_count + 1))
            continue
        fi

        print_info "  → Executing: npx convex run $convex_function"

        # Run the migration
        if npx convex run "$convex_function" 2>&1 | tee -a "$LOG_FILE"; then
            print_success "  ✓ Migration completed: $migration_name"
            log "SUCCESS: $migration_name"
            success_count=$((success_count + 1))
        else
            print_error "  ✗ Migration failed: $migration_name"
            log "ERROR: Migration failed: $migration_name"
            error_count=$((error_count + 1))

            # Ask if we should continue or stop
            if [ "$CI" != "true" ]; then
                read -p "Continue with remaining migrations? (y/n) " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_warning "Migration process stopped by user"
                    log "Migration process stopped by user"
                    exit 1
                fi
            else
                # In CI, continue with other migrations
                print_warning "Continuing with remaining migrations..."
            fi
        fi

        echo ""  # Blank line between migrations
    done <<< "$migration_files"

    # Summary
    echo ""
    print_info "========================================="
    print_info "Migration Summary:"
    print_success "  Successful: $success_count"
    if [ $error_count -gt 0 ]; then
        print_error "  Failed: $error_count"
    else
        print_info "  Failed: $error_count"
    fi
    print_info "  Total: $migration_count"
    print_info "========================================="

    log "=== Migration run completed: $success_count successful, $error_count failed ==="

    # Return success if all migrations passed
    if [ $error_count -eq 0 ]; then
        print_success "All migrations completed successfully!"
        return 0
    else
        print_error "Some migrations failed. Check $LOG_FILE for details."
        return 1
    fi
}

# Run main function
main "$@"
