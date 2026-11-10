import Link from "next/link";
import { DownloadButton } from "@/components/DownloadButton";
import { LaneArt } from "@/components/LaneArt";
import { DemoVideo } from "@/components/DemoVideo";
import { GitHubStars } from "@/components/GitHubStars";
import { FIRST_QUESTIONS, FaqList } from "@/components/Faq";
import { DOWNLOAD_URL, GITHUB_URL, LAUNCH, REQUIREMENTS, asset, DISCORD_URL } from "@/lib/site";

const FACTS = [
  "Free and open source (MIT)",
  "Apple Silicon, macOS 14.2+",
  "Runs on your Mac, no account",
  "Never saves the music it listens to",
];

const STEPS = [
  {
    title: "Play a song",
    body: "In Spotify, Apple Music, or YouTube, the way you already do. OnKey listens along. It doesn't play or download music itself.",
  },
  {
    title: "The first play teaches it",
    body: "When the song ends, OnKey takes a couple of minutes to learn the singer's notes and line up the lyrics.",
  },
  {
    title: "Sing with the pitch guide",
    body: "Next time, the notes scroll towards you and your voice is drawn over them. Green is on the note, red is off.",
  },
  {
    title: "See how you did",
    body: "You get a score, the notes you hit and missed, and your recording to play back with the song.",
  },
];

const btn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-medium transition";
const primary = `${btn} bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent-strong`;
const secondary = `${btn} border border-line text-fg hover:bg-panel`;

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(700px_300px_at_50%_30%,var(--accent-wash),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-10 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="rise grid gap-6">
            <p className="text-sm font-medium text-accent-soft">A free, open-source singing trainer for Mac</p>
            <h1 className="text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-fg sm:text-5xl sm:leading-[1.08]">
              Learn to sing the songs you love.
            </h1>
            <p className="-mt-3 text-balance text-base italic text-muted">Saving shower singers from themselves since 2026</p>
            <p className="max-w-[54ch] text-lg leading-relaxed text-muted">
              OnKey listens to the music playing on your Mac and learns the singer's melody. Then it shows you a
              pitch guide as you sing, so you can see where you're sharp or flat.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <DownloadButton where="top" className={primary} />
              <a href={GITHUB_URL} data-track="GitHub" className={secondary}><GitHubMark />Source on GitHub<GitHubStars /></a>
              <Link href="/docs/how-it-works/" className="inline-flex min-h-12 items-center px-2 font-medium text-accent-soft underline-offset-4 hover:underline">
                How it works →
              </Link>
            </div>
            <ul className="grid gap-x-6 gap-y-1.5 text-sm text-muted sm:grid-cols-2" aria-label="At a glance">
              {FACTS.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-good" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <figure className="rise grid gap-3" style={{ animationDelay: "120ms" }}>
            {LAUNCH.demoVideo ? (
              // the video is the app's own window: no mock window around it
              <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-2xl shadow-black/30">
                <DemoVideo src={asset(LAUNCH.demoVideo)} poster={LAUNCH.demoPoster ? asset(LAUNCH.demoPoster) : undefined} />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/20">
                <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 truncate text-xs text-muted">Learned song · score 82</span>
                </div>
                <LaneArt />
              </div>
            )}
            <figcaption className="text-center text-xs text-muted">
              {LAUNCH.demoVideo ? "Me singing along, scored as I go." : "Illustration of the singing lane. Demo video coming soon."}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-line bg-bg-raised" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="how" className="text-2xl font-semibold tracking-tight text-fg">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid content-start gap-2 rounded-2xl border border-line bg-panel p-5">
                <span className="tabular text-base font-medium text-accent-soft">Step {i + 1}</span>
                <h3 className="text-lg font-semibold text-fg">{s.title}</h3>
                <p className="text-base leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-base text-muted">
            Want the details? <Link href="/docs/how-it-works/" className="text-accent-soft underline underline-offset-4">Read exactly how OnKey works</Link>, with diagrams.
          </p>
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="privacy">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="grid content-start gap-4">
            <h2 id="privacy" className="text-2xl font-semibold tracking-tight text-fg">It listens, but never saves the music</h2>
            <p className="leading-relaxed text-muted">
              OnKey listens to the music only to learn the melody and keep the notes in time. It never saves or
              uploads it. What stays on your Mac is the notes it learns and a recording of your mic for each take, so
              you can hear yourself back.
            </p>
            <Link href="/docs/privacy/" className="text-sm text-accent-soft underline underline-offset-4">Privacy &amp; legal</Link>
          </div>
          <ul className="grid content-start gap-3">
            {[
              ["No account, no server, no analytics", "What leaves your Mac: a Shazam signature (not audio) to name a new song, the song's name to LRCLIB for lyrics and to Apple for covers, and a daily update check on GitHub."],
              ["Fair scoring", "Singing an octave lower still counts, and your timing gets 80 ms of slack. Being sharp or flat is what costs you."],
              ["Headphones or speakers", "Headphones give the most reliable scores. On speakers, your mic hears the song as well as you, so OnKey filters the song out."],
            ].map(([t, b]) => (
              <li key={t} className="rounded-2xl border border-line bg-panel p-4">
                <p className="font-medium text-fg">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-bg-raised" aria-labelledby="faq">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="grid content-start gap-3">
            <h2 id="faq" className="text-2xl font-semibold tracking-tight text-fg">Questions</h2>
            <p className="text-muted">The ones people ask first. <Link href="/docs/faq/" className="text-accent-soft underline underline-offset-4">All questions</Link>.</p>
          </div>
          <FaqList items={FIRST_QUESTIONS} />
        </div>
      </section>

      <section className="border-t border-line" aria-labelledby="get">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
          <div className="grid gap-2">
            <h2 id="get" className="text-2xl font-semibold tracking-tight text-fg">Get OnKey</h2>
            <p className="text-muted">Free and open source under the MIT licence. {REQUIREMENTS.join(", ")}.</p>
          </div>
          {/* on a phone the three buttons stack at one width; side by side from sm up */}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <DownloadButton where="bottom" className={primary} />
            <a href={GITHUB_URL} data-track="GitHub" className={secondary}><GitHubMark />Source on GitHub<GitHubStars /></a>
            {DISCORD_URL && <a href={DISCORD_URL} data-track="Discord" className={secondary}><DiscordMark />Join the Discord</a>}
          </div>
        </div>
      </section>
    </>
  );
}
