#!/usr/bin/env python3
"""Check an updater bundle's signature the way OnKey's updater will (minisign, Ed25519), against the public key
OnKey trusts (src-tauri/tauri.conf.json, plugins.updater.pubkey). scripts/release.sh runs it before publishing, so
a release signed with the wrong key (one OnKey would refuse to install) never goes out.
    scripts/verify-update-sig.py <OnKey_X.Y.Z_arm64.app.tar.gz> [tauri.conf.json]
Exit 0: valid. 1: invalid. 2: can't check here (no `cryptography` module)."""
import base64, hashlib, json, sys

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.exceptions import InvalidSignature
except ImportError:
    print("verify-update-sig: python's cryptography module isn't installed: not checked", file=sys.stderr)
    sys.exit(2)


def lines(b64):
    """Tauri wraps minisign's text files (comment line, base64 line, ...) in one more base64."""
    return base64.b64decode(b64).decode().strip().splitlines()


def main():
    bundle = sys.argv[1]
    conf = sys.argv[2] if len(sys.argv) > 2 else "src-tauri/tauri.conf.json"
    pub = base64.b64decode(lines(json.load(open(conf))["plugins"]["updater"]["pubkey"])[1])
    sig_lines = lines(open(bundle + ".sig").read().strip())
    sig = base64.b64decode(sig_lines[1])
    trusted = sig_lines[2].removeprefix("trusted comment: ").encode()
    global_sig = base64.b64decode(sig_lines[3])
    alg, key_id, signature = sig[:2], sig[2:10], sig[10:74]
    if pub[:2] != b"Ed" or key_id != pub[2:10]:
        print(f"verify-update-sig: signed by key {key_id[::-1].hex().upper()}, OnKey trusts {pub[2:10][::-1].hex().upper()}", file=sys.stderr)
        return 1
    data = open(bundle, "rb").read()
    msg = hashlib.blake2b(data, digest_size=64).digest() if alg == b"ED" else data
    key = Ed25519PublicKey.from_public_bytes(pub[10:42])
    try:
        key.verify(signature, msg)
        key.verify(global_sig, signature + trusted)
    except InvalidSignature:
        print("verify-update-sig: the signature doesn't match", file=sys.stderr)
        return 1
    print(f"verify-update-sig: ok (key {key_id[::-1].hex().upper()})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
