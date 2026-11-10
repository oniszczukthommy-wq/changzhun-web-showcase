#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -d '/Applications/唱准助手.app' ]]; then
  open '/Applications/唱准助手.app'
else
  open 'src-tauri/target/release/bundle/macos/唱准助手.app'
fi
