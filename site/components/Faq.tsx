import Link from "next/link";
import { DATA_DIR, GITHUB_URL, WINDOWS_ISSUE_URL } from "@/lib/site";

export type QA = { id: string; q: string; a: React.ReactNode };

/** The questions a first-time reader asks before downloading. Shown on the home page and at the top of the FAQ. */
export const FIRST_QUESTIONS: QA[] = [
  {
    id: "network",
    q: "Does anything leave my Mac?",
    a: (
      <>
        <p>OnKey never saves or uploads the music it listens to. Your recordings and learned songs stay on your Mac. What does go out:</p>
        <ul>
          <li><strong>Shazam</strong> (Apple): a signature of up to 5 seconds of the music app's sound (not the audio, and never your mic) to name a new song when nothing else can say what's playing. That's YouTube, other apps, or Listen only. Spotify and Apple Music name their own songs, and songs you've sung before are recognised on your Mac. You can turn Shazam off in Settings.</li>
          <li><strong>LRCLIB</strong>: the song's artist, title, album, and length, to fetch synced lyrics (unless Show lyrics is off).</li>
          <li><strong>Apple</strong>: the artist and title to find album covers, and a recognised song's Apple Music id to get its length. The covers themselves load from Spotify's, Apple's, or YouTube's image servers.</li>
          <li><strong>GitHub</strong>: a daily check for a new version, and its download. You can turn this off in Settings.</li>
        </ul>
        <p>There's no account, no analytics, and no server of mine. "Report a problem" only saves a file on your Mac, for you to attach to a GitHub issue if you want to. <Link href="/docs/privacy/">Privacy in full</Link>.</p>
      </>
    ),
  },
  {
    id: "music",
    q: "Does OnKey provide or download music?",
    a: (
      <p>
        No. Your own music app plays the song (Spotify, Apple Music, or YouTube in a browser). OnKey listens to learn
        the singer's notes and never saves the music.
      </p>
    ),
  },
  {
    id: "kept",
    q: "What does it keep on my Mac?",
    a: (
      <p>
        For each song: the notes, a fingerprint and Shazam signature, and the lyrics with their timing. For each take:
        a <strong>recording of your mic</strong> (about 0.5 MB a minute), your scores, and the lyrics you sang, so you
        can play it back. It's all in <code>{DATA_DIR}</code> (except a take you share, which is saved as a video in Downloads), and deleting a take or song moves it to the Trash. It
        never keeps the music, though a take sung over speakers will pick up some of it.
      </p>
    ),
  },
  {
    id: "permissions",
    q: "Which permissions does it ask for?",
    a: (
      <ul>
        <li><strong>Microphone</strong>: to hear you sing.</li>
        <li><strong>System audio recording</strong>: to hear the music app or browser that's playing. macOS calls it recording, but OnKey analyses the sound as it plays and doesn't save it.</li>
        <li><strong>Control of Spotify and Music</strong> (asked in setup): to read what's playing and where, and to play, pause, and seek for "Sing it again". Choose "Listen only" in setup, or turn them off under "Let OnKey control" in Settings, and OnKey never sends them anything.</li>
        <li><strong>Control of your browser</strong> (only if you turn YouTube on): the same for a YouTube tab.</li>
      </ul>
    ),
  },
  {
    id: "macs",
    q: "Which Macs does it run on?",
    a: (
      <p>
        Apple Silicon (M1 or later) on macOS 14.2 or later. 14.2 is the first version that lets one app hear another
        app's sound without extra drivers, and the models need Apple Silicon to keep up. 8 GB of memory is enough.
        Intel Macs aren't supported.
      </p>
    ),
  },
  {
    id: "windows",
    q: "Why no Windows, Linux, or phone version?",
    a: (
      <p>
        OnKey is built on macOS's per-app audio capture and Core ML. Windows can also hear one app's sound, so a port
        is possible, but I haven't started one. If you'd use it, say so on the <a href={WINDOWS_ISSUE_URL} data-track="Windows issue">Windows
        issue</a>. Phones don't let one app hear another, so a phone version would need a different approach.
      </p>
    ),
  },
  {
    id: "browser",
    q: "How does it compare? And why not in the browser?",
    a: (
      <>
        <p>
          Most singing apps need their own catalogue, backing tracks, or hand-made note charts. OnKey learns from the
          music you already play, so you practise with the original artist. Songs with a clear lead vocal work best.
        </p>
        <p>
          A web page can't hear the Spotify or Apple Music app, can't ask them what's playing, and can't use ShazamKit
          or Core ML. So it's a Mac app.
        </p>
      </>
    ),
  },
  {
    id: "scoring",
    q: "How is the score worked out?",
    a: (
      <p>
        Every 10 ms that you and the singer both sing, your pitch is compared with theirs. Within half a semitone
        gets full credit, fading to none at a semitone and a half. Octaves don't count against you, and your timing
        gets 80 ms of slack. The score is your accuracy, scaled by how much of the singer's part you sang.
        More in <Link href="/docs/scoring/">Scoring explained</Link>.
      </p>
    ),
  },
  {
    id: "licence",
    q: "What's the licence?",
    a: (
      <p>
        MIT. It's free and the source is on GitHub. The models have their own licences, listed
        in <Link href="/docs/credits/">Credits</Link>.
      </p>
    ),
  },
];

/** Everyday questions, after the first ones, on the FAQ page. */
export const MORE_QUESTIONS: QA[] = [
  {
    id: "first-play",
    q: "Why does the first play not show any notes?",
    a: (
      <p>
        OnKey learns a song after its first play ends, so there are no notes yet. You see the lyrics instead, a line
        at a time (in time with the singer for the first minute and a half or so, except on 8 GB Macs). Sing along
        anyway, as that take is still scored. From the second play, the notes scroll towards you with the words on
        them.
      </p>
    ),
  },
  {
    id: "learning",
    q: "Why can't I sing a song yet? It says \"Learning…\"",
    a: (
      <p>
        Learning happens after the song ends and took two to three minutes on my Mac. The "Sing it again" button shows the
        progress and comes back when it's done. Other songs stay singable meanwhile. One song is learned at a time, so
        songs played back to back say "Waiting to learn" until their turn. Learning also pauses while you sing a song
        OnKey already knows.
      </p>
    ),
  },
  {
    id: "starters",
    q: "What should I sing first?",
    a: (
      <p>
        OnKey suggests songs it follows well. They show on the Sing page when nothing's playing, at the bottom of the
        Library, and when you click the OnKey logo on the Sing page. Each has links to Spotify and Apple Music.
      </p>
    ),
  },
  {
    id: "busy",
    q: "Will it slow my Mac down?",
    a: (
      <p>
        Singing a learned song is light: 15 to 19% of one CPU core on my Mac. Learning is the heavy part, so OnKey
        does it after the song ends, one song at a time, at low priority. While learning, it used about 1.7 GB of
        memory (2.4 GB at most). On Macs with less than 32 GB, the models are unloaded after each song.
      </p>
    ),
  },
  {
    id: "headphones",
    q: "Do I need headphones?",
    a: (
      <p>
        No, but they give the most reliable scores. On speakers, echo cancelling takes the song back out of your mic:
        20 dB or more on a MacBook's speakers, 8 to 14 dB on external speakers. Loud music can still leak through.
      </p>
    ),
  },
  {
    id: "octave",
    q: "Can I sing in a lower or higher octave?",
    a: <p>Yes. An octave away from the singer counts as on the note.</p>,
  },
  {
    id: "apps",
    q: "Which music apps work?",
    a: (
      <p>
        Spotify, Apple Music, and YouTube in Chrome, Brave, Edge, or Safari. By default, OnKey asks Spotify and Apple
        Music what's playing, so positions are exact, and it can play and pause them from its own window. With
        "Listen only" (every app off under "Let OnKey control" in Settings), it recognises songs by their sound. YouTube is followed by its sound unless you let OnKey
        control your browser.
      </p>
    ),
  },
  {
    id: "shazam",
    q: "Why use Shazam? Isn't that sending audio to Apple?",
    a: (
      <p>
        ShazamKit sends a signature (a fingerprint worked out on your Mac), not the audio, and never your mic. OnKey
        only asks Shazam when nothing else can name the song: YouTube, other apps, or Listen only. Songs you've sung
        before are recognised on your Mac first. Turn off Settings &rarr; &ldquo;Use Shazam to name new songs&rdquo;
        and nothing goes to Apple, but only songs you've already learned are recognised by sound.
      </p>
    ),
  },
  {
    id: "lyrics-off",
    q: "Can I turn the lyrics off?",
    a: (
      <p>
        Yes, in Settings &rarr; &ldquo;Show lyrics&rdquo;. With it off, OnKey asks LRCLIB for nothing and shows no
        words. Lyrics already on your Mac are hidden, not deleted. The notes and score work as usual, and songs learned
        with lyrics off get their notes from the melody alone.
      </p>
    ),
  },
  {
    id: "odd-scores",
    q: "Some songs score oddly. Why?",
    a: <p>Rapped or spoken songs barely have a melody to score, and harmonies or choirs can confuse which voice is the tune. See <Link href="/docs/scoring/">the limits</Link>.</p>,
  },
  {
    id: "report",
    q: "Something went wrong. How do I report it?",
    a: (
      <p>
        Use <strong>Report a problem</strong> in Settings, the Help menu, or a take's page. It shows you what goes in
        the zip (the last three days of OnKey's log and a summary of each play, with song names but no lyrics, audio,
        or recordings) and saves it on your Mac. Nothing is uploaded. Then open an issue
        on <a href={`${GITHUB_URL}/issues`}>GitHub</a> and attach the zip if you're happy to.
        Have a look at <Link href="/docs/troubleshooting/">Troubleshooting</Link> first.
      </p>
    ),
  },
  {
    id: "updates",
    q: "How do I get updates?",
    a: (
      <p>
        Automatically. Once a day OnKey checks GitHub for a new version and downloads it in the background (about
        350 MB, as the models are inside the app). It installs when you choose Restart to update or when you quit,
        never mid-song. You can turn the checks off in Settings.
      </p>
    ),
  },
];

/** A list of questions as open/close rows. */
export function FaqList({ items }: { items: QA[] }) {
  return (
    <div className="grid gap-3">
      {items.map(({ id, q, a }) => (
        <details key={id} id={`faq-${id}`} className="group scroll-mt-24 rounded-xl border border-line bg-panel [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-medium text-fg">
            {q}
            <span aria-hidden="true" className="text-lg leading-none text-faint transition group-open:rotate-45 motion-reduce:transition-none">+</span>
          </summary>
          <div className="faq-answer px-4 pb-4 text-[15px] leading-relaxed text-fg-soft">{a}</div>
        </details>
      ))}
    </div>
  );
}
