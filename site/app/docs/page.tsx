import type { Metadata } from "next";
import Link from "next/link";
import { DOWNLOAD_URL, LAUNCH, REQUIREMENTS } from "@/lib/site";

export const metadata: Metadata = { title: "Getting started" };

export default function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p className="lede">Install OnKey, give it two permissions, and play a song.</p>

      <h2>What you need</h2>
      <ul>
        {REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}
        <li>Music playing in Spotify or Apple Music, or YouTube in Chrome, Brave, Edge, or Safari.</li>
        <li>A microphone (the built-in one works). Headphones give the most reliable scores.</li>
      </ul>
      <p>
        macOS 14.2 is the first version that lets one app hear another app's sound without extra drivers, and the
        models need Apple Silicon to run fast enough.
      </p>

      <h2>Install</h2>
      <ol>
        <li>
          Download <code>OnKey.dmg</code> from the <a href={DOWNLOAD_URL} data-track="Download for Mac">releases page</a>. It&rsquo;s about 350 MB
          (about 420 MB installed) because the models come inside the app, so it never downloads anything else.
        </li>
        <li>Open it and drag OnKey into Applications.</li>
        {LAUNCH.notarised ? (
          <li>Open OnKey. It's signed and notarised by Apple, so it opens like any other app.</li>
        ) : (
          <li>
            Open OnKey. This build isn't notarised yet, so macOS says it can't check the app the first time.
            Go to <strong>System Settings → Privacy &amp; Security</strong>, scroll down, and click <strong>Open
            Anyway</strong>. You only need to do this once.
          </li>
        )}
      </ol>
      <p>
        After that, OnKey checks GitHub for a new version once a day, downloads it in the background (about 350 MB),
        and installs it when you restart or quit, never mid-song. You can turn this off in <strong>Settings</strong>.
      </p>

      <h2>Permissions</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Permission</th><th>Why OnKey needs it</th></tr></thead>
          <tbody>
            <tr><td><strong>Microphone</strong></td><td>To hear you sing.</td></tr>
            <tr><td><strong>System audio recording</strong></td><td>To hear the music app, so OnKey can learn the melody and keep the notes in time. macOS calls it recording, but OnKey analyses the sound as it plays and never saves it.</td></tr>
            <tr><td><strong>Control Spotify and Music</strong> (asked in setup)</td><td>To read what's playing and where, and to play, pause, and seek for "Sing it again" and skipping. Setup asks macOS for each app that's open. An app that isn't open asks the first time you play a song in it. Choose "Listen only" and OnKey never sends Spotify or Music anything, and follows the song by its sound.</td></tr>
            <tr><td><strong>Control your browser</strong> (optional, for YouTube)</td><td>Only if you turn YouTube on, in Settings or on the Sing page: to read the YouTube tab's time and title, and play, pause, and seek it.</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Songs you've sung before are recognised on your Mac, new ones by Shazam. If you said no to a permission by
        mistake, go to <strong>System Settings → Privacy &amp; Security</strong>, find the section, and switch OnKey on.
      </p>

      <h2>Your first song</h2>
      <ol>
        <li>
          Open OnKey and play a song in Spotify, Apple Music, or YouTube. Not sure what to sing? Click the OnKey logo
          on the Sing page for suggestions.
        </li>
        <li>
          The first time, there are no notes yet. You see the lyrics a line at a time, in time with the singer for the
          first minute and a half or so (except on 8 GB Macs). Sing along if you like, as this take is still scored.
        </li>
        <li>
          When the song ends, OnKey <strong>learns it</strong>. That took two to three minutes on my Mac, and the Sing
          button says "Learning…" until it's done. One song is learned at a time, so songs played back to back
          say "Waiting to learn" until their turn.
        </li>
        <li>
          Play it again. The notes stay dimmed ("Lining up with the song…") for a few seconds until OnKey knows where
          you are. Then they scroll towards you with the words on them, and your pitch is drawn live.
        </li>
        <li>
          When it ends, you get a score, a report on every note and line, and your recording to play back with the song.
        </li>
      </ol>
      <p className="callout">
        A song counts as learned once OnKey has heard about 70% of it. If you skip around, the rest is learned the
        next time you play those parts.
      </p>
      <p>
        Singing a lot? Have a read of <Link href="/docs/your-voice/">singing comfortably</Link>. After about 35 minutes,
        OnKey reminds you to rest your voice.
      </p>
      <p>
        Next: <Link href="/docs/how-it-works/">how OnKey works</Link>, <Link href="/docs/scoring/">how the score works</Link>,
        or <Link href="/docs/troubleshooting/">troubleshooting</Link>.
      </p>
    </>
  );
}
