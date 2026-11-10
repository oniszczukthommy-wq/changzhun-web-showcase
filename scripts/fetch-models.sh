#!/bin/sh
# Fetches (or exports) the large models OnKey needs to learn songs into src-tauri/models/ (they aren't in git;
# the app bundles them: src-tauri/src/models.rs). For building from source; the app itself downloads nothing.
#   crepe-full-b32.onnx, wav2vec2-base-960h-fp16.onnx: exported from their published weights, with the Python
#     packages in scripts/requirements-models.txt (PYTHON=<that venv's python>), then checked by SHA-256
#   UVR_MDXNET_KARA_2.onnx   downloaded from the Ultimate Vocal Remover model repository, checked by SHA-256
#   game/*.onnx                GAME small (OpenVPI, MIT) from its release, checked by SHA-256
set -e
PY=${PYTHON:-python3}
# a relative path (PYTHON=.venv/bin/python) is from where you ran this: make it absolute before the cd below
case $PY in */*) PY="$(cd "$(dirname "$PY")" && pwd)/$(basename "$PY")" ;; esac
cd "$(dirname "$0")/../src-tauri/models"
KARA=UVR_MDXNET_KARA_2.onnx
KARA_SHA=bf32e15105a09c0f7dddd2b67346146334d6f3ecb399ed7638eba2ab07cbf5f4
if [ ! -f "$KARA" ]; then
  curl -fL -o "$KARA.part" "https://github.com/TRvlvr/model_repo/releases/download/all_public_uvr_models/$KARA"
  echo "$KARA_SHA  $KARA.part" | shasum -a 256 -c - && mv "$KARA.part" "$KARA"
fi
{ [ -f wav2vec2-base-960h-fp16.onnx ] && [ -f crepe-full-b32.onnx ]; } || "$PY" -c 'import torch, torchaudio, torchcrepe, onnx, onnxruntime' 2>/dev/null || {
  echo "fetch-models: $PY lacks the packages to export two models. Set them up once:" >&2
  echo "  python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements-models.txt" >&2
  echo "  PYTHON=.venv/bin/python scripts/fetch-models.sh" >&2
  exit 1
}
[ -f wav2vec2-base-960h-fp16.onnx ] || "$PY" ../../scripts/export_wav2vec2.py wav2vec2-base-960h-fp16.onnx
[ -f crepe-full-b32.onnx ] || "$PY" ../../scripts/export_crepe.py full crepe-full-b32.onnx 32
# the exported files must match what the app checks at launch (other library versions can differ by a byte)
for m in crepe-full-b32.onnx wav2vec2-base-960h-fp16.onnx; do
  want=$(grep -A1 "\"$m\"" ../src/models.rs | grep -o '[0-9a-f]\{64\}' | head -1)
  echo "$want  $m" | shasum -a 256 -c - >/dev/null 2>&1 || {
    echo "fetch-models: $m was exported with different library versions than OnKey expects (the app would call it" >&2
    echo "  damaged). Use the versions in scripts/requirements-models.txt, delete $m and run this again." >&2
    exit 1
  }
done
GAME_ZIP=GAME-1.0.3-small-onnx.zip
GAME_SHA=00ba0c64115b6b874d9ea4afd3e6cf822abda2a04e52569233b0a044fd40e4e8
if [ ! -f game/encoder.onnx ]; then
  curl -fL -o "$GAME_ZIP" "https://github.com/openvpi/GAME/releases/download/v1.0.3/$GAME_ZIP"
  echo "$GAME_SHA  $GAME_ZIP" | shasum -a 256 -c -
  mkdir -p game && unzip -j -o "$GAME_ZIP" '*.onnx' -d game && rm "$GAME_ZIP"
fi
echo "models ready"
