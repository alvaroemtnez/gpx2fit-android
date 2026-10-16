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


# Download Bootstrap
echo "Downloading Bootstrap..."
curl -L https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css -o public/css/bootstrap.min.css

# Download Font Awesome
echo "Downloading Font Awesome..."
curl -L https://use.fontawesome.com/releases/v7.1.0/fontawesome-free-7.1.0-web.zip -o fontawesome.zip
unzip -q fontawesome.zip
rm -rf public/css/fontawesome public/css/webfonts
mv fontawesome-free-7.1.0-web/css public/css/fontawesome
mv fontawesome-free-7.1.0-web/webfonts public/css/webfonts
rm -rf fontawesome-free-7.1.0-web fontawesome.zip

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
