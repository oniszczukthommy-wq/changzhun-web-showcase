#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
# The fallback paths are the private toolchain installed for this Mac.
if ! command -v cargo >/dev/null 2>&1; then
  export CARGO_HOME="$HOME/.local/share/changzhun-toolchain/cargo"
  export RUSTUP_HOME="$HOME/.local/share/changzhun-toolchain/rustup"
  export PATH="$CARGO_HOME/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
fi
./ui/node_modules/.bin/next build ui
./node_modules/.bin/tauri build --config src-tauri/tauri.changzhun.conf.json --bundles app
# Local ad-hoc signing covers the complete app bundle, including the bundled models.
codesign --force --deep --sign - --identifier local.changzhun.mac 'src-tauri/target/release/bundle/macos/唱准助手.app'
codesign --verify --deep --strict 'src-tauri/target/release/bundle/macos/唱准助手.app'
