#!/usr/bin/env bash
# build.sh - Build the GPX2FIT Android app from the command line, no Android Studio needed.
#
# Usage: ./build.sh [debug|release|install|serve|setup|clean|distclean]   (default: debug)
#
# Everything needed (JDK, Node.js, Android SDK, Gradle and npm caches) is downloaded
# into .tools/ inside the repository; nothing is installed system-wide.
# See the "Building the Android app" section of README.md for details.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$ROOT/android"
DIST_DIR="$ROOT/dist"
TOOLS_DIR="$ROOT/.tools"

# Capacitor 7 compiles for Java 21 (and Gradle 8.13 can't run on JDK 24+).
JDK_VERSION=21
# Capacitor 7 CLI requires Node.js 20+.
NODE_VERSION=22
CMDLINE_TOOLS_VERSION=13114758

JDK_DIR="$TOOLS_DIR/jdk-$JDK_VERSION"
NODE_DIR="$TOOLS_DIR/node-$NODE_VERSION"
SDK_DIR="$TOOLS_DIR/android-sdk"

# Make every tool use the copies in .tools/, regardless of what the system has.
export JAVA_HOME="$JDK_DIR"
export ANDROID_HOME="$SDK_DIR"
unset ANDROID_SDK_ROOT
export GRADLE_USER_HOME="$TOOLS_DIR/gradle"
export npm_config_cache="$TOOLS_DIR/npm-cache"
export PATH="$NODE_DIR/bin:$JDK_DIR/bin:$PATH"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mWarning:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

require() {
    local cmd
    for cmd in "$@"; do
        command -v "$cmd" >/dev/null || die "'$cmd' not found, please install it."
    done
}

# Print the architecture name used in download URLs: "x64"/"aarch64" (JDK) or "x64"/"arm64" (Node.js).
arch() {
    case "$(uname -m)" in
        x86_64) echo x64 ;;
        aarch64|arm64) [ "$1" = node ] && echo arm64 || echo aarch64 ;;
        *) die "Unsupported architecture $(uname -m)." ;;
    esac
}

# Download a tarball and unpack its single top-level directory as $2.
fetch_tarball() {
    local url="$1" dest="$2" tmp
    tmp="$(mktemp -d)"
    curl -fL "$url" -o "$tmp/archive"
    mkdir -p "$tmp/out"
    tar -xf "$tmp/archive" -C "$tmp/out" --strip-components=1
    mkdir -p "$(dirname "$dest")"
    mv "$tmp/out" "$dest"
    rm -rf "$tmp"
}

setup_jdk() {
    [ -x "$JDK_DIR/bin/java" ] && return
    info "Downloading Temurin JDK $JDK_VERSION"
    fetch_tarball "https://api.adoptium.net/v3/binary/latest/$JDK_VERSION/ga/linux/$(arch jdk)/jdk/hotspot/normal/eclipse" "$JDK_DIR"
}

setup_node() {
    [ -x "$NODE_DIR/bin/node" ] && return
    local base="https://nodejs.org/dist/latest-v$NODE_VERSION.x" file
    file="$(curl -fsSL "$base/SHASUMS256.txt" | grep -o "node-v[0-9.]*-linux-$(arch node)\.tar\.xz" | head -n 1)"
    [ -n "$file" ] || die "Could not find a Node.js $NODE_VERSION download for this system."
    local version="${file#node-}"
    info "Downloading Node.js ${version%%-linux-*}"
    fetch_tarball "$base/$file" "$NODE_DIR"
}

setup_sdk() {
    local sdkmanager="$SDK_DIR/cmdline-tools/latest/bin/sdkmanager"
    if [ ! -x "$sdkmanager" ]; then
        info "Downloading Android command line tools"
        local tmp
        tmp="$(mktemp -d)"
        curl -fL "https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip" -o "$tmp/cmdline-tools.zip"
        unzip -q "$tmp/cmdline-tools.zip" -d "$tmp"
        mkdir -p "$SDK_DIR/cmdline-tools"
        mv "$tmp/cmdline-tools" "$SDK_DIR/cmdline-tools/latest"
        rm -rf "$tmp"
    fi

    local api
    api="$(sed -n 's/.*compileSdkVersion *= *\([0-9]*\).*/\1/p' "$ANDROID_DIR/variables.gradle")"
    [ -d "$SDK_DIR/platforms/android-$api" ] && [ -d "$SDK_DIR/build-tools/$api.0.0" ] && [ -d "$SDK_DIR/platform-tools" ] && return

    info "Accepting Android SDK licenses"
    yes | "$sdkmanager" --sdk_root="$SDK_DIR" --licenses >/dev/null || true
    info "Installing platform-tools, platforms;android-$api and build-tools;$api.0.0"
    "$sdkmanager" --sdk_root="$SDK_DIR" "platform-tools" "platforms;android-$api" "build-tools;$api.0.0"
}

# Download whatever is missing from .tools/.
setup() {
    require curl tar unzip
    setup_jdk
    setup_node
    setup_sdk
}

# Download the web libraries (Vue, Leaflet...) served from the app itself, so it works offline.
web_deps() {
    if [ ! -f "$ROOT/public/js/vue.global.prod.js" ] || [ ! -f "$ROOT/public/js/lib/material-color-utilities/index.js" ]; then
        info "Downloading offline web dependencies"
        (cd "$ROOT" && ./setup-offline.sh)
    fi
}

# Create public/js/config.js (not committed) from the CARTO_API_KEY environment variable, if set.
web_config() {
    local config="$ROOT/public/js/config.js"
    if [ -n "${CARTO_API_KEY:-}" ]; then
        info "Writing CARTO API key to public/js/config.js"
        sed "s/cartoApiKey: ''/cartoApiKey: '$CARTO_API_KEY'/" "$ROOT/public/js/config.example.js" > "$config"
    elif [ ! -f "$config" ]; then
        warn "public/js/config.js not found, the map will show 'API KEY REQUIRED'. See README.md."
    fi
}

# Download the offline web dependencies, install npm packages and copy the web app into the Android project.
prepare_web() {
    web_deps
    web_config
    info "Installing npm dependencies"
    (cd "$ROOT" && npm ci)
    info "Syncing web app into the Android project"
    (cd "$ROOT" && npx cap sync android)
}

# Run the web version on a local development server.
serve() {
    require curl tar unzip
    setup_node
    web_deps
    web_config
    (cd "$ROOT" && npm ci && npm start)
}

gradle() {
    (cd "$ANDROID_DIR" && ./gradlew --no-daemon "$@")
}

build_debug() {
    setup
    prepare_web
    info "Building debug APK"
    gradle assembleDebug
    mkdir -p "$DIST_DIR"
    cp "$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk" "$DIST_DIR/gpx2fit-debug.apk"
    info "Done: $DIST_DIR/gpx2fit-debug.apk"
}

build_release() {
    setup
    prepare_web
    info "Building release APK"
    gradle assembleRelease

    local unsigned="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
    mkdir -p "$DIST_DIR"
    if [ -z "${GPX2FIT_KEYSTORE:-}" ]; then
        cp "$unsigned" "$DIST_DIR/gpx2fit-release-unsigned.apk"
        info "GPX2FIT_KEYSTORE not set, APK left unsigned: $DIST_DIR/gpx2fit-release-unsigned.apk"
        return
    fi

    local build_tools
    build_tools="$(ls -d "$SDK_DIR"/build-tools/* | sort -V | tail -n 1)"

    local args=(sign --ks "$GPX2FIT_KEYSTORE" --out "$DIST_DIR/gpx2fit-release.apk")
    [ -n "${GPX2FIT_KEY_ALIAS:-}" ] && args+=(--ks-key-alias "$GPX2FIT_KEY_ALIAS")
    # Passwords are read from the environment if set, otherwise apksigner asks for them.
    [ -n "${GPX2FIT_KEYSTORE_PASS:-}" ] && args+=(--ks-pass env:GPX2FIT_KEYSTORE_PASS)
    [ -n "${GPX2FIT_KEY_PASS:-}" ] && args+=(--key-pass env:GPX2FIT_KEY_PASS)

    info "Signing release APK with $GPX2FIT_KEYSTORE"
    "$build_tools/apksigner" "${args[@]}" "$unsigned"
    info "Done: $DIST_DIR/gpx2fit-release.apk"
}

install_debug() {
    build_debug
    info "Installing on connected device"
    "$SDK_DIR/platform-tools/adb" install -r "$DIST_DIR/gpx2fit-debug.apk"
}

# Remove build outputs.
clean() {
    rm -rf "$ANDROID_DIR/build" "$ANDROID_DIR/app/build" "$ANDROID_DIR/.gradle" "$DIST_DIR"
}

# Remove build outputs, downloaded tools, npm packages and files generated by Capacitor.
distclean() {
    clean
    rm -rf "$TOOLS_DIR" "$ROOT/node_modules" \
        "$ANDROID_DIR/capacitor-cordova-android-plugins" \
        "$ANDROID_DIR/app/src/main/assets/public" \
        "$ANDROID_DIR/app/src/main/assets/capacitor.config.json" \
        "$ANDROID_DIR/app/src/main/assets/capacitor.plugins.json" \
        "$ANDROID_DIR/app/src/main/res/xml/config.xml"
}

case "${1:-debug}" in
    debug) build_debug ;;
    release) build_release ;;
    install) install_debug ;;
    serve) serve ;;
    setup) setup ;;
    clean) clean ;;
    distclean) distclean ;;
    -h|--help|help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//' ;;
    *) die "Unknown command '$1'. Use: debug, release, install, serve, setup, clean or distclean." ;;
esac
