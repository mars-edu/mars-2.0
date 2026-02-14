#!/bin/bash

# Post-install script to set up fonts and apply Framework7 patches

# Copy fonts from dependencies
echo "Copying fonts..."
cpy --flat ./node_modules/framework7-icons/fonts/*.* ./src/fonts/
cpy --flat ./node_modules/material-icons/iconfont/*.* ./src/fonts/

# Apply Framework7 popover patch if needed
echo "Checking Framework7 popover patch..."
PATCH_FILE="framework7-popover-fix.patch"

if [ -f "$PATCH_FILE" ]; then
    # Try git apply first (most reliable for git repos)
    if git apply --check "$PATCH_FILE" 2>/dev/null; then
        echo "Applying Framework7 popover patch with git..."
        git apply "$PATCH_FILE"
        echo "Framework7 popover patch applied successfully."
    # Fallback to patch command
    elif patch -p1 --dry-run < "$PATCH_FILE" 2>/dev/null; then
        echo "Applying Framework7 popover patch with patch..."
        patch -p1 < "$PATCH_FILE"
        echo "Framework7 popover patch applied successfully."
    else
        echo "Framework7 popover patch already applied or cannot be applied."
    fi
else
    echo "Framework7 popover patch file not found: $PATCH_FILE"
fi

# Clear Vite optimized deps cache so patched Framework7 files are re-bundled
if [ -d "./node_modules/.vite" ]; then
    echo "Clearing Vite optimized deps cache..."
    rm -rf ./node_modules/.vite/deps ./node_modules/.vite/deps_temp* 2>/dev/null || true
fi
