#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATCH_FILE="${1:-$ROOT_DIR/framework7-popover-fix.patch}"

FILES=(
  "framework7:components/popover/popover-class.js"
  "framework7:components/popover/popover.js"
  "framework7:components/popover/popover.d.ts"
  "framework7:components/popup/popup-class.js"
  "framework7:components/popup/popup.js"
  "framework7:components/popup/popup.d.ts"
  "framework7-vue:components/popover.js"
  "framework7-vue:components/popover.d.ts"
  "framework7-vue:components/popup.js"
  "framework7-vue:components/popup.d.ts"
)

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() {
  printf '[patch-gen] %s\n' "$1"
}

fail() {
  printf '[patch-gen] ERROR: %s\n' "$1" >&2
  exit 1
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    fail "Missing file: $path"
  fi
}

pack_original() {
  local pkg="$1"
  local version="$2"
  local pkg_tmp="$TMP_DIR/original/$pkg"
  mkdir -p "$pkg_tmp"

  log "Packing $pkg@$version"
  local tarball
  tarball="$(npm pack "$pkg@$version" --silent --pack-destination "$TMP_DIR" | tail -n 1)"
  require_file "$TMP_DIR/$tarball"

  tar -xzf "$TMP_DIR/$tarball" --strip-components=1 -C "$pkg_tmp"
}

cd "$ROOT_DIR"

require_file "$ROOT_DIR/node_modules/framework7/package.json"
require_file "$ROOT_DIR/node_modules/framework7-vue/package.json"

FRAMEWORK7_VERSION="$(node -p "require('./node_modules/framework7/package.json').version")"
FRAMEWORK7_VUE_VERSION="$(node -p "require('./node_modules/framework7-vue/package.json').version")"

pack_original "framework7" "$FRAMEWORK7_VERSION"
pack_original "framework7-vue" "$FRAMEWORK7_VUE_VERSION"

mkdir -p "$(dirname "$PATCH_FILE")"
: > "$PATCH_FILE"

changes=0
for entry in "${FILES[@]}"; do
  pkg="${entry%%:*}"
  rel="${entry#*:}"

  original="$TMP_DIR/original/$pkg/$rel"
  modified="$ROOT_DIR/node_modules/$pkg/$rel"

  require_file "$original"
  require_file "$modified"

  if ! diff_output="$(diff -u \
    --label "a/node_modules/$pkg/$rel" \
    --label "b/node_modules/$pkg/$rel" \
    "$original" \
    "$modified")"; then
    printf '%s\n' "$diff_output" >> "$PATCH_FILE"
    changes=$((changes + 1))
  fi
done

if [[ "$changes" -eq 0 ]]; then
  rm -f "$PATCH_FILE"
  fail "No differences found; patch file was not generated."
fi

log "Generated $PATCH_FILE ($changes file diffs)"
