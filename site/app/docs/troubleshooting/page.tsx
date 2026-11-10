import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_URL, DISCORD_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Troubleshooting" };

export default function Troubleshooting() {
  return (
    <>
      <h1>Troubleshooting</h1>
      <p className="lede">What to do when OnKey won't start, can't hear, can't name a song, or is out of time with your headphones.</p>

      <h2>It stays on "Starting OnKey…"</h2>
      <p>
        This normally takes a few seconds. If it's still there after a minute, quit OnKey (<strong>⌘Q</strong>) and
        open it again. If that doesn't help, <a href="#report">report a problem</a>.
      </p>

      <h2>Permission questions</h2>
      <p>OnKey asks for three things in setup:</p>
      <ul>
        <li><strong>Microphone</strong>: if you said no, go to <strong>System Settings → Privacy &amp; Security → Microphone</strong> and turn OnKey on.</li>
        <li>
          <strong>System audio recording</strong>: needed to hear the music app. If you said no, or OnKey says it
          "can't hear … yet", go to <strong>System Settings → Privacy &amp; Security → Screen &amp; System Audio
          Recording</strong> and turn OnKey on under <strong>System Audio Recording Only</strong>.
        </li>
        <li>
          <strong>Control of Spotify and Apple Music</strong>: setup asks macOS for each app that's open. An app
          that isn't open asks the first time you play a song in it. If the question doesn't appear, click <strong>Carry
          on</strong>. macOS asks the first time you play a song there. To change your answer, go to <strong>System Settings → Privacy &amp;
          Security → Automation → OnKey</strong>, or use <strong>Let OnKey control</strong> in OnKey's Settings.
        </li>
      </ul>
      <p>
        The buttons in OnKey's messages open the right page of System Settings. macOS may ask you to reopen OnKey
        after you change a permission.
      </p>

      <h2>A new song takes a while to be named</h2>
      <p>
        New songs are named by Shazam, which needs an internet connection, and the first answer after installing can
        be slow. Keep the song playing, as OnKey keeps asking. If it says Shazam can't be reached, check your
        connection. Songs you've already learned are still recognised on your Mac. Allowing control of Spotify or
        Apple Music is quicker, as OnKey can ask the app what's playing.
      </p>

      <h2>No notes on a song</h2>
      <p>
        OnKey learns a song after its first play ends, and the Sing button says "Learning…" until it's done. One song
        is learned at a time, so others say "Waiting to learn". Learning also pauses while you sing a song OnKey
        already knows ("Waiting while you sing"), so the notes stay smooth. A song counts as learned once OnKey has
        heard about 70% of it, so if you skipped around, play it through once more.
      </p>

      <h2>The notes are dim and say "Lining up with the song…"</h2>
      <p>
        OnKey keeps the notes dimmed until the music confirms where you are, so you never sing to notes in the wrong
        place. It usually takes a few seconds after a song starts or after you skip. If it stays dim, check the
        music app's own volume isn't turned right down, as OnKey needs to hear it. Turn the app up and use your
        Mac's volume instead.
      </p>

      <h2>On a first play the lyrics show a whole line at a time</h2>
      <p>
        That's expected. Until a song is learned, OnKey doesn't know when each word is sung, so it shows the whole
        line. From the next play the words are on the note bars.
      </p>

      <h2 id="timing">Lyrics early or late on headphones?</h2>
      <p>
        OnKey allows for how long your headphones or speakers take to play the sound, using the figure macOS reports
        for each output. In my tests that was close enough, Bluetooth included, so there&rsquo;s nothing to set.
      </p>
      <p>
        If the notes still look early or late, OnKey may not have lined up with the song yet. Give it a few seconds,
        or skip back a little. Your score isn&rsquo;t affected either way, as OnKey works out your delay after each song.
        If it keeps happening on one pair of headphones, please <a href={`${GITHUB_URL}/issues`} data-track="GitHub">tell me</a> which ones.
      </p>

      <h2>No lyrics, or the wrong ones</h2>
      <p>
        Lyrics come from <a href="https://lrclib.net">LRCLIB</a>, a free, community-run database. Some songs aren't
        in it, or only in a different version. When it finds nothing, OnKey asks again after a day.
      </p>

      <h2>Your Mac feels busy</h2>
      <p>
        Learning a new song is the heavy part, so OnKey does it after the song ends, at low priority. Singing a learned
        song is light. Two settings help:
      </p>
      <ul>
        <li><strong>Save battery while singing</strong> (on by default): on battery, the notes are drawn 30 times a second instead of 60.</li>
        <li><strong>Keep learning models ready</strong> (on by default only with 32 GB or more): turn it off and the models (about 1.5 GB) are unloaded after each song. On 8 GB Macs it isn't shown, as they're always unloaded.</li>
      </ul>

      <h2>Where the logs are</h2>
      <p>OnKey writes a plain-text log to <code>$TMPDIR/onkey.log</code>. To open it, run this in Terminal:</p>
      <pre><code>open $TMPDIR/onkey.log</code></pre>
      <p>
        It also keeps each day's log and a short summary of each play (timings, CPU, memory, build, and Mac) in the
        <code> records/</code> folder of its data folder, for 30 days and at most 200 MB. They hold no audio or
        lyrics, but they do name the songs you played.
      </p>

      <h2 id="report">Report a problem</h2>
      <ol>
        <li>
          Choose <strong>Report a problem</strong> in Settings or <strong>Help → Report a Problem…</strong>, or <strong>Report a problem with
          this take</strong> on a take's page.
        </li>
        <li>
          OnKey shows you what goes in the zip: the last three days of its log and a summary of each play. No lyrics,
          audio, recordings, user name, or home folder. Add a note if you like, then <strong>Save</strong> it on your
          Mac. Nothing is uploaded.
        </li>
        <li>
          Choose <strong>Open a GitHub issue</strong> (or go to <a href={`${GITHUB_URL}/issues`}>GitHub</a>), say what
          happened and with which song, and attach the zip if you're happy to.
        </li>
      </ol>
      <p>
        More answers in the <Link href="/docs/faq/">FAQ</Link>.{DISCORD_URL && <> Or ask in <a href={DISCORD_URL} data-track="Discord">OnKey's Discord</a>.</>}
      </p>
    </>
  );
}
