import type { Metadata } from "next";
import { Privacy as PrivacyDiagram } from "@/components/diagrams/Privacy";
import { CONTACT_EMAIL, DATA_DIR, FLOWMYNA_TRACKER_ID, NOT_AFFILIATED, codeUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy & legal" };

export default function Privacy() {
  return (
    <>
      <h1>Privacy &amp; legal</h1>
      <p className="lede">
        OnKey runs on your Mac and never saves the music it listens to. Your recordings and learned songs stay on your
        Mac. This page lists everything it keeps and everything it sends.
      </p>

      <figure className="wide -mx-4 overflow-hidden border-y border-line sm:mx-0 sm:rounded-2xl sm:border" style={{ maxWidth: "40rem" }}>
        <PrivacyDiagram all />
      </figure>

      <h2>What OnKey keeps on your Mac</h2>
      <p>Everything is in <code>{DATA_DIR}</code>.</p>
      <ul>
        <li><strong>Learned songs</strong> (<code>songs/</code>): the singer's pitch line and note bars, a rhythm fingerprint and a Shazam signature of the music (to recognise the song and find your place), when each lyric line starts, and when each word was heard sung (times only, not the words).</li>
        <li><strong>Lyrics</strong> (<code>lrclib/</code>): LRCLIB's answers, kept up to 30 days (a day if there were none). A learned song keeps the lyrics its timings were made for, so the same words show every play. Lyrics are never uploaded. With Settings &rarr; &ldquo;Show lyrics&rdquo; off, kept lyrics are hidden (not deleted) and none are fetched.</li>
        <li>
          <strong>Takes</strong> (<code>takes/</code>): <strong>a recording of your microphone</strong> (<code>mic.m4a</code>,
          about 0.5 MB a minute) so you can play it back, your scores, and the report, which includes the lyrics and
          their times. A take is only saved if you sang along with at least 10% of the singer's part. If the music was on speakers, some
          of it is in the recording too. Recordings are kept up to 2 GB in total. Past that the oldest go first,
          but never a favourite song's or a song's best take.
        </li>
        <li>
          <strong>Records</strong> (<code>records/</code>), for diagnosing problems: a log file a day and a summary of
          each play (timings, CPU, memory, the build and the Mac). These are numbers and ids, with no audio or lyrics,
          though the log names the songs you played. Kept 30 days, at most 200 MB. They only leave your Mac if you
          attach a report to an issue yourself.
        </li>
        <li>Your settings, any artist and title you typed for a YouTube video, the starter songs' covers, and a cache of the compiled models.</li>
      </ul>
      <p>
        Forget a song in Library or delete a take in History and its files go to the Trash. To remove everything,
        quit OnKey and delete the folder above.
      </p>

      <h2>What OnKey never keeps</h2>
      <p>
        The music's audio, or the singer's voice separated from it. It's analysed in memory as it plays and never
        saved, uploaded, shared, or exported. (Your mic recording can contain it if you sang with the music on
        speakers.)
      </p>

      <h2>What leaves your Mac</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Sent to</th><th>What, and when</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>Shazam</strong> (Apple, via ShazamKit)</td>
              <td>A signature of up to 5 seconds of the <strong>music app's</strong> sound (never your microphone), not the audio itself. It's only sent to name a song OnKey hasn't learned when no music app says what's playing: YouTube, other apps, or Listen only. Spotify and Apple Music name their own songs, and songs you've sung before are recognised on your Mac with nothing sent. Settings &rarr; &ldquo;Use Shazam to name new songs&rdquo; turns it off, and then only songs already learned are recognised.</td>
            </tr>
            <tr>
              <td><strong><a href="https://lrclib.net">LRCLIB</a></strong></td>
              <td>The song's artist, title, album and length when a song starts, to fetch synced lyrics, then a search by name if that finds nothing. Answers are kept on your Mac for up to 30 days (a day if there were none), so a song played again isn't asked about again. LRCLIB is a free, community-run lyrics database. Nothing is sent with &ldquo;Show lyrics&rdquo; off.</td>
            </tr>
            <tr>
              <td><strong>iTunes Search and Lookup</strong> (Apple)</td>
              <td>The artist and title, to find an album cover (which links to its Apple Music page), also for older songs learned from Spotify. And the Apple Music id Shazam returned, for the song's length and album. The &ldquo;Try these&rdquo; starter covers are looked up once each, spaced out, and kept, so later visits send nothing.</td>
            </tr>
            <tr>
              <td><strong>Cover images</strong></td>
              <td>Ordinary image requests to Spotify's, Apple's or YouTube's image servers when a cover is shown.</td>
            </tr>
            <tr>
              <td><strong>GitHub</strong></td>
              <td>A check for a newer version of OnKey a minute after launch and then once a day, and the download if there is one. With <strong>Check for updates automatically</strong> off in Settings, it only checks when you press <strong>Check now</strong>.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Nothing else goes out: there's no account, no analytics, no crash reporting, and no server of mine. Your recordings are
        never uploaded. &ldquo;Report a problem&rdquo; shows you what's in its zip of numbers and logs, saves it on
        your Mac, and sends nothing. You choose whether to attach it to a GitHub issue. The models come inside the
        app, so it never downloads them.
      </p>
      <p>
        This website (not the app) counts visits with Plausible. It uses no cookies and nothing that identifies you,
        and only keeps totals, such as how many people visited, where from, and how many clicked Download.
        {FLOWMYNA_TRACKER_ID && <> Anonymous visit paths also go to Flow Myna, my own analytics tool: which parts of
        the site a visit read, in order, and the rough location the connection came from (such as the country). No
        cookies, and your IP address isn't kept.</>} The star count on the GitHub buttons comes straight from GitHub, so your
        browser asks GitHub for it.
      </p>

      <h2>Streaming services</h2>
      <p>
        OnKey doesn't provide, stream, or download music. Your own music app plays it, and OnKey listens through
        macOS's audio-capture permission. It doesn't use any streaming service's SDK or developer API, and doesn't
        touch any app's files, memory, or encryption.
      </p>
      <p>
        By default it follows Spotify and Apple Music through macOS's Automation permission (asked in setup): it reads
        what's playing and where, and plays, pauses, seeks and starts songs. If you turn on &ldquo;YouTube in your browser&rdquo; in Settings (it's off at first), OnKey also reads and controls the YouTube tab in Chrome, Brave, Edge or Safari. Choose &ldquo;Listen only&rdquo; in setup, or turn them off under &ldquo;Let OnKey control&rdquo; in
        Settings, and OnKey never sends those apps anything.
      </p>
      <p>
        OnKey never saves or exports the music it hears. Your music service's own terms still apply to how you use
        it.
      </p>

      <h2>Rights holders</h2>
      <p>
        If you represent a rights holder or a service and have a concern about OnKey, email{" "}
        {CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`} data-track="Email">{CONTACT_EMAIL}</a> : <strong>(address to come)</strong>}.
        I read every message and will reply quickly. Where a concern is valid, I'll change or remove the feature
        involved. See also <a href={codeUrl("LEGAL.md")}>LEGAL.md</a>.
      </p>

      <h2>Trademarks</h2>
      <p>{NOT_AFFILIATED}</p>

      <h2>Licence</h2>
      <p>OnKey is free and open source under the MIT licence.</p>
    </>
  );
}
