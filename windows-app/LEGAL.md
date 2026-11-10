# Rights holders and legal contact

OnKey is a free, open-source singing trainer that runs on the user's Mac. It doesn't provide, stream or
download music: it listens to the music the user is already playing in their own music app, through macOS's
audio-capture permission, to learn the singer's melody and show a pitch guide, and:

- never saves, uploads, shares or exports that music's audio, or any part of it, such as a separated vocal.
  Its published source can't either: there's no code in it that writes the music to disk. To
  name a song it hasn't learned, it sends Apple's Shazam a short fingerprint of a few seconds of the music app's
  sound (not the audio) to name the song. The microphone is never sent;
- doesn't use any streaming service's developer API or SDK, and doesn't touch any app's files, memory or
  encryption. By default (asked in setup, through macOS's Automation permission) it reads what Spotify or Apple
  Music is playing and where, and can play, pause and seek there, as any remote control can; "Listen only" in
  setup, or the app switches in Settings, turn this off;
- makes only these network requests: synced lyrics from [LRCLIB](https://lrclib.net) when a song is first played,
  unless the user turns "Show lyrics" off (the song's artist, title, album and length; the answer is kept on your Mac, so a song played again isn't
  asked about again, and is never shared); a
  Shazam signature of the music app's sound to Apple's ShazamKit, and the Apple Music ID it returns to Apple's
  iTunes Lookup (for the song's length and album); an artist and title to Apple's iTunes Search, for album
  covers, which link to the song on Apple Music (for the "Try these" starter songs, once each: the cover is then
  kept on the Mac); the cover images themselves (from Spotify's, Apple's or YouTube's image hosts); and a check for a newer version of OnKey on GitHub, and its download (the learning models
  come inside the app: nothing else is downloaded);
- stores only the melody's notes (pitch and timing) that it learns, the lyrics it fetched, the user's own
  voice (a recording sung with the music on speakers can contain some of it), and logs for diagnosing problems
  (no audio or lyrics).

OnKey is made for personal practice at home. The README's [Using OnKey fairly](README.md#using-onkey-fairly)
asks users to keep what it learns to themselves, not to post recordings or screen captures with the music, and not
to use it as a karaoke system in public; OnKey offers no way to export or share learned songs.

If you represent a rights holder or a service and have a concern about OnKey, please email
**[hello@singonkey.app](mailto:hello@singonkey.app)**. We read every message and will respond promptly, and where a concern is valid we'll
change or remove the feature involved.

OnKey isn't affiliated with or endorsed by Spotify, Apple or Google. Their names are trademarks of their owners
and are used only to say which apps OnKey works with.
