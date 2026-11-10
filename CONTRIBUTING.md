# Contributing to OnKey

Thanks for wanting to help. Bug reports, songs where the notes or lyrics go wrong, and small focused pull requests
are all welcome.

## Reporting a problem

Use **Report a problem** in the app (Settings → About, the Help menu, or a take's page). It shows what goes in a zip
of numbers and logs (no audio, no lyrics, no recordings of you), saves it on your Mac, and you can attach it to a
[bug report](../../issues/new/choose). Say which music app and output device you used: most timing problems depend
on them.

## Building from source

You need an Apple Silicon Mac with macOS 14.2 or later, the Xcode command line tools, Rust and Node.

```sh
npm install && npm --prefix ui install
scripts/fetch-models.sh        # the large models, checked by SHA-256 (Python setup below)
npx tauri build
```

`scripts/fetch-models.sh` exports two of the models from their published weights, so it needs Python 3 with a few
packages, at the versions that reproduce the files exactly. Set them up once, then fetch:

```sh
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements-models.txt
PYTHON=.venv/bin/python scripts/fetch-models.sh
```
 A build signed ad hoc runs on your own Mac; naming songs through Shazam's
catalogue needs a Developer ID signature with a provisioning profile for an App ID that has the ShazamKit service.

## Tests

```sh
cd src-tauri
cargo test                     # unit tests: scoring, placement, lyrics, storage, the report's redaction, … (--release needs ~4 GB more disk)
cd ../ui && npm run build      # the interface builds and type-checks
```

A **sync suite** replays scripted sessions (starts, skips, pauses, autoplay, Bluetooth delay) through the real
listener and checks OnKey knows where it is in the song. It and a few other harnesses (track replay, self-scoring)
need recordings of real music, which can't be shared, so they aren't in the repo. If your change touches
placement, timing or scoring, say so in the pull request and I'll run them.

## Checking a release

Each release lists the SHA-256 of its files in `SHA256SUMS`, attached to the release. To check a downloaded disk
image matches:

```sh
shasum -a 256 ~/Downloads/OnKey.dmg
```

If you'd rather not trust my build, build your own from the release's tagged commit. It's the same code, but it
won't match mine byte for byte. Mine carries my code signature and Apple's notarisation, and builds aren't
reproducible across machines yet.

## Pull requests

- One change per pull request, with a sentence on what it fixes and how you checked it.
- Keep the privacy promises: the music's audio is never saved or sent, and nothing new goes over the network without
  being listed in the README's Privacy section, the site's Privacy page, and [scripts/release-hosts.txt](scripts/release-hosts.txt) (the release
  check fails a build with a host that isn't).
- Match the style around you: plain names, comments that say why.

## Licence

OnKey is MIT licensed ([LICENSE](LICENSE)). By contributing, you agree your contribution is released under the same
licence.

## Be kind

Assume good intent, be patient with people new to this, and keep criticism about the code. Harassment of any kind
isn't welcome here.
