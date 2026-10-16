#!/bin/sh
# setup-offline.sh - Setup all dependencies for offline use

echo "Setting up offline dependencies for GPX2FIT Converter..."

# Create directories
mkdir -p public/css/images public/js public/images

# Download Vue.js
echo "Downloading Vue.js..."
curl -L https://unpkg.com/vue@3.2.40/dist/vue.global.prod.js -o public/js/vue.global.prod.js

# Download Leaflet
echo "Downloading Leaflet..."
curl -L https://unpkg.com/leaflet@1.9.1/dist/leaflet.css -o public/css/leaflet.css
curl -L https://unpkg.com/leaflet@1.9.1/dist/leaflet.js -o public/js/leaflet.js

# Download Leaflet Fullscreen
echo "Downloading Leaflet Fullscreen..."
curl -L https://unpkg.com/leaflet.fullscreen@2.4.0/Control.FullScreen.css -o public/css/leaflet-fullscreen.css
curl -L https://unpkg.com/leaflet.fullscreen@2.4.0/Control.FullScreen.js -o public/js/leaflet-fullscreen.js

# Download Leaflet images
curl -L https://unpkg.com/leaflet@1.9.1/dist/images/layers-2x.png -o public/css/images/layers-2x.png
curl -L https://unpkg.com/leaflet@1.9.1/dist/images/layers.png -o public/css/images/layers.png
curl -L https://unpkg.com/leaflet@1.9.1/dist/images/marker-icon-2x.png -o public/css/images/marker-icon-2x.png
curl -L https://unpkg.com/leaflet@1.9.1/dist/images/marker-icon.png -o public/css/images/marker-icon.png
curl -L https://unpkg.com/leaflet@1.9.1/dist/images/marker-shadow.png -o public/css/images/marker-shadow.png
curl -L https://unpkg.com/leaflet.fullscreen@2.4.0/icon-fullscreen.svg -o public/css/icon-fullscreen.svg


# Download BeerCSS (Material Design 3 components) and the Material Symbols icon font
echo "Downloading BeerCSS..."
rm -rf public/css/beercss beercss.tmp
mkdir -p public/css/beercss beercss.tmp
curl -L https://registry.npmjs.org/beercss/-/beercss-5.0.3.tgz | tar -xz -C beercss.tmp --strip-components=1
cp beercss.tmp/dist/cdn/beer.min.css \
   beercss.tmp/dist/cdn/material-symbols-outlined.woff2 \
   beercss.tmp/dist/cdn/material-symbols-subset.woff2 \
   beercss.tmp/LICENSE \
   public/css/beercss/
rm -rf beercss.tmp

# Download Material Color Utilities (generates the Material 3 color scheme)
echo "Downloading Material Color Utilities..."
rm -rf public/js/lib/material-color-utilities
mkdir -p public/js/lib/material-color-utilities
curl -L https://registry.npmjs.org/@material/material-color-utilities/-/material-color-utilities-0.3.0.tgz \
  | tar -xz -C public/js/lib/material-color-utilities --strip-components=1 \
      --exclude='*.ts' --exclude='*.map' --exclude='*.test.js' --exclude='*.md' --exclude='package.json'

echo "All dependencies downloaded successfully!"
echo "Project structure:"
find public/css public/js -type f | sort
