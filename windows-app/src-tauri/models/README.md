# Models

| File | What it does | Size | Licence | Source |
|---|---|---|---|---|
| `crepe-tiny.onnx` | your pitch, live and after a song | 2 MB | MIT | torchcrepe's `tiny` weights, exported to ONNX (committed) |
| `crepe-full-b32.onnx` | the singer's pitch line, when a song is learned (fixed batch of 32 frames, so it runs on Core ML) | 85 MB | MIT | torchcrepe's `full` weights, exported to ONNX |
| `UVR_MDXNET_KARA_2.onnx` | separates the lead vocal (leaves backing vocals out) | 50 MB | MIT, credit UVR (UVR's README asks third-party apps to credit UVR and its developers) | Ultimate Vocal Remover model repository (github.com/TRvlvr/model_repo) |
| `wav2vec2-base-960h-fp16.onnx` | when each word of a lyric line is sung, for one bar per syllable | 189 MB | MIT | torchaudio's WAV2VEC2_ASR_BASE_960H (fairseq), exported in 16-bit (as accurate as 32-bit on JamendoLyrics: 84% of words within 0.3 s) |

Syllable counts come from the CMU Pronouncing Dictionary (`src-tauri/data/syllables-en.txt`, BSD-style licence in `data/CMUDICT-LICENSE`).

The large ones aren't in git. Fetch them with `scripts/fetch-models.sh` before building. The app bundles all of
them (`tauri.conf.json` `bundle.resources`) and downloads none: `src-tauri/src/models.rs` lists each with its size
and SHA-256, checks at launch that the bundled set is whole, and `scripts/check-release.sh` checks the SHA-256s of
the ones in a built app before it ships.

GAME small v1.0.3 (`game/*.onnx`, OpenVPI, MIT) does the syllable notes. Credits and licence texts for every model:
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
