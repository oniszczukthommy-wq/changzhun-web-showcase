#!/bin/bash
# Packs OnKey.app into the DMG people open: the usual Mac install window, with OnKey on the left, an arrow, and
# Applications on the right ("Drag OnKey to Applications"), big icons, no toolbar. make-dmg.sh calls it, then signs
# and notarises the DMG it makes.
#   scripts/pack-dmg.sh <OnKey.app> <out.dmg>
# The window's layout is saved by Finder itself (an AppleScript), so the first run asks to let this terminal control
# Finder (System Settings > Privacy & Security > Automation). The background is design/dmg-background.png (+ @2x),
# drawn by design/dmg-background.py; the icon positions here match it.
set -euo pipefail
APP=${1:?usage: scripts/pack-dmg.sh <OnKey.app> <out.dmg>}
OUT=${2:?usage: scripts/pack-dmg.sh <OnKey.app> <out.dmg>}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$APP" ] || { echo "pack-dmg: no app at $APP" >&2; exit 1; }
W=660; H=400; APP_X=170; APPS_X=490; ICON_Y=190   # as in design/dmg-background.py

WORK=$(mktemp -d); MNT=""
cleanup() { [ -n "$MNT" ] && hdiutil detach -quiet -force "$MNT" 2>/dev/null; rm -rf "$WORK"; }
trap cleanup EXIT

STAGE="$WORK/stage"; mkdir -p "$STAGE/.background"
cp -R "$APP" "$STAGE/OnKey.app"
ln -s /Applications "$STAGE/Applications"
# one image holding both sizes, so the background is sharp on Retina screens
tiffutil -cathidpicheck "$ROOT/design/dmg-background.png" "$ROOT/design/dmg-background@2x.png" \
  -out "$STAGE/.background/background.tiff" 2>/dev/null

# a writable image to lay out. Finder finds disks by name, and an OnKey DMG may already be open: lay it out under
# a name of its own, renamed OnKey (the window's title) before it's closed
RW="$WORK/rw.dmg"; TMPNAME="OnKey-layout-$$"
hdiutil create -volname "$TMPNAME" -srcfolder "$STAGE" -fs HFS+ -format UDRW -ov "$RW" > /dev/null
MNT="$WORK/mnt"; mkdir "$MNT"
hdiutil attach -readwrite -noverify -noautoopen -nobrowse -mountpoint "$MNT" "$RW" > /dev/null
# -nobrowse keeps it out of the desktop, but Finder must see it to lay it out: show it to Finder by its path
osascript - "$MNT" "$W" "$H" "$APP_X" "$APPS_X" "$ICON_Y" <<'OSA'
on run argv
  set mnt to item 1 of argv
  set w to (item 2 of argv) as integer
  set h to (item 3 of argv) as integer
  set appX to (item 4 of argv) as integer
  set appsX to (item 5 of argv) as integer
  set iconY to (item 6 of argv) as integer
  tell application "Finder"
    set d to (POSIX file mnt) as alias
    open d
    set cw to container window of d
    set current view of cw to icon view
    set toolbar visible of cw to false
    set statusbar visible of cw to false
    set pathbar visible of cw to false
    set the bounds of cw to {200, 120, 200 + w, 120 + h}
    set opts to the icon view options of cw
    set arrangement of opts to not arranged
    set icon size of opts to 128
    set text size of opts to 13
    set label position of opts to bottom
    set shows item info of opts to false
    set shows icon preview of opts to false
    set background picture of opts to (file ".background:background.tiff" of d)
    set position of item "OnKey.app" of d to {appX, iconY}
    set position of item "Applications" of d to {appsX, iconY}
    update d without registering applications
    delay 1
    close cw
    -- reopen once so Finder writes the final layout, then close
    open d
    delay 1
    close container window of d
  end tell
end run
OSA
# Finder writes .DS_Store when it likes: wait for it, then make sure it's there
for _ in $(seq 20); do [ -f "$MNT/.DS_Store" ] && break; sleep 0.5; done
[ -f "$MNT/.DS_Store" ] || { echo "pack-dmg: Finder didn't save the window layout" >&2; exit 1; }
chflags hidden "$MNT/.background" 2>/dev/null || true
rm -rf "$MNT/.fseventsd" 2>/dev/null || true
diskutil rename "$MNT" OnKey > /dev/null
sync
hdiutil detach -quiet "$MNT"; MNT=""
rm -f "$OUT"
hdiutil convert "$RW" -format UDZO -imagekey zlib-level=9 -o "$OUT" > /dev/null
echo "pack-dmg: $OUT (the install window: OnKey, an arrow, Applications)"
