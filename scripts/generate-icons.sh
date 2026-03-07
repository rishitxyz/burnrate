#!/usr/bin/env bash
# =============================================================================
# Generate Tauri app icons from the SVG logo.
# Requires: rsvg-convert (librsvg) or sips (macOS built-in)
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVG="$ROOT/frontend-neopop/public/burnrate-logo.svg"
ICON_DIR="$ROOT/src-tauri/icons"
mkdir -p "$ICON_DIR"

convert_svg() {
  local size=$1
  local output=$2

  if command -v rsvg-convert &>/dev/null; then
    rsvg-convert -w "$size" -h "$size" "$SVG" -o "$output"
  elif command -v sips &>/dev/null; then
    # macOS: sips can't read SVG directly, use a temp PNG via python
    python3 -c "
import subprocess, tempfile, os
tmp = tempfile.mktemp(suffix='.png')
# Use cairosvg if available, otherwise create a simple placeholder
try:
    import cairosvg
    cairosvg.svg2png(url='$SVG', write_to=tmp, output_width=$size, output_height=$size)
except ImportError:
    # Fallback: create an orange circle icon using PIL
    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGBA', ($size, $size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        margin = int($size * 0.05)
        draw.ellipse([margin, margin, $size - margin, $size - margin], fill=(232, 93, 38, 255))
        inner = int($size * 0.3)
        draw.ellipse([inner, inner, $size - inner, $size - inner], fill=(255, 179, 71, 255))
        img.save(tmp)
    except ImportError:
        # Absolute fallback: 1x1 pixel
        import struct
        with open(tmp, 'wb') as f:
            # Minimal valid PNG
            pass
        raise SystemExit('Need cairosvg or Pillow to generate icons from SVG')
print(tmp)
" | while read tmp; do
      if [ -f "$tmp" ]; then
        sips -z "$size" "$size" "$tmp" --out "$output" &>/dev/null
        rm -f "$tmp"
      fi
    done
  else
    echo "Warning: No SVG converter found. Skipping icon generation."
    exit 0
  fi
}

echo "==> Generating Tauri icons from $SVG"

# Generate PNGs at required sizes
convert_svg 32 "$ICON_DIR/32x32.png"
convert_svg 128 "$ICON_DIR/128x128.png"
convert_svg 256 "$ICON_DIR/128x128@2x.png"
convert_svg 256 "$ICON_DIR/icon.png"

echo "==> Generated PNG icons"

# Generate .icns for macOS
if command -v iconutil &>/dev/null; then
  ICONSET="$ICON_DIR/icon.iconset"
  mkdir -p "$ICONSET"
  for size in 16 32 64 128 256 512; do
    convert_svg "$size" "$ICONSET/icon_${size}x${size}.png"
    double=$((size * 2))
    if [ "$double" -le 1024 ]; then
      convert_svg "$double" "$ICONSET/icon_${size}x${size}@2x.png"
    fi
  done
  iconutil -c icns "$ICONSET" -o "$ICON_DIR/icon.icns"
  rm -rf "$ICONSET"
  echo "==> Generated icon.icns"
fi

# Generate .ico for Windows (multi-size)
if command -v convert &>/dev/null; then
  TMPDIR_ICO=$(mktemp -d)
  for size in 16 24 32 48 64 128 256; do
    convert_svg "$size" "$TMPDIR_ICO/icon_${size}.png"
  done
  convert "$TMPDIR_ICO"/icon_*.png "$ICON_DIR/icon.ico"
  rm -rf "$TMPDIR_ICO"
  echo "==> Generated icon.ico"
elif command -v sips &>/dev/null; then
  cp "$ICON_DIR/256x256.png" "$ICON_DIR/icon.ico" 2>/dev/null || \
  cp "$ICON_DIR/icon.png" "$ICON_DIR/icon.ico" 2>/dev/null || true
  echo "==> Copied PNG as icon.ico (convert not available)"
fi

echo "==> Icon generation complete"
