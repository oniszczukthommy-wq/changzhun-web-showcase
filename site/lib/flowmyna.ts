// Visit paths for Flow Myna (the developer's process-mining tool), the website only, never the app.
//
// Flow Myna's script (fm.js) runs cookieless: it stores nothing in the browser, and a visit is stitched together on
// Flow Myna's side from a daily-rotating salted hash. Its autocapture records every page ("Viewed /docs/faq/"); the
// server adds source, device and country. Clicks are recorded only on links it counts as calls to action, so every
// way out carries `data-track` with one of a small, fixed set of names ("Clickout: Download for Mac", "GitHub",
// "Discord", "Windows issue", "Daniel's site", "Email"): without it, a Download click is never recorded.
// The events here add what autocapture can't see: how far down the long landing page a visit read, which questions
// it opened, a phone sending itself the link, and which troubleshooting topics were read. Each at most once per
// page view, so going back over a page shows as a loop, not a pile of repeats.

import { FLOWMYNA_TRACKER_ID } from "./site";

type Props = Record<string, string | number | boolean>;
type FM = { capture: (name: string, props?: Props) => void; register?: (props: Props) => void };

/** Our events, as named in Flow Myna's process map (a small, fixed set: each is a node). */
export const FM_EVENTS = {
  sawHow: "Saw How it works",
  sawPrivacy: "Saw Privacy",
  sawQuestions: "Saw Questions",
  reachedGet: "Reached Get OnKey",
  openedQuestion: "Opened a question",
  sentToMac: "Sent link to Mac",
  readTopic: "Read a troubleshooting topic",
} as const;

/** Only the real site is tracked: never localhost, a LAN address or a preview deployment. */
export const isLiveSite = () => typeof window !== "undefined" && /(^|\.)singonkey\.app$/.test(location.hostname);

const fmApi = () => (window as unknown as { FlowMyna?: FM }).FlowMyna;

let sent = new Set<string>();
let lastSent = Date.now();

/** Flow Myna ends a visit after 30 minutes with no events (its stitching.py, SESSION_WINDOW_MINUTES). */
const VISIT_GAP_MS = 30 * 60 * 1000;

/** A new page view: every event may be sent again once. */
export function newPageView() {
  sent = new Set();
  lastSent = Date.now();
}

/** A tab left open past Flow Myna's visit window and then used again starts a new visit there. fm.js doesn't
 *  resend the page view (the page didn't reload), so that visit would begin mid-page, e.g. at "Saw How it works".
 *  Send the page view again ("Viewed <path>", named exactly as fm.js's autocapture names it) so it starts on the page. */
export function resumeIfIdle() {
  if (!FLOWMYNA_TRACKER_ID || !isLiveSite() || Date.now() - lastSent < VISIT_GAP_MS) return;
  let path = location.pathname.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  newPageView();
  try { fmApi()?.capture(`Viewed ${path}`, { navigation_type: "return" }); } catch {}
}

/** Send `event` once per page view (`key` widens that, e.g. per question). Never throws, never blocks. */
export function fm(event: string, props?: Props, key = event) {
  if (!FLOWMYNA_TRACKER_ID || !isLiveSite()) return;
  resumeIfIdle();
  if (sent.has(key)) return;
  sent.add(key);
  lastSent = Date.now();
  try { fmApi()?.capture(event, props); } catch {}
}

/** Label the visit (held in memory by fm.js, sent with each batch): is it on a Mac? */
export function labelVisit() {
  if (!FLOWMYNA_TRACKER_ID || !isLiveSite()) return;
  const ua = navigator.userAgent;
  const mac = /Macintosh/i.test(ua) && navigator.maxTouchPoints <= 1;
  try { fmApi()?.register?.({ on_a_mac: mac }); } catch {}
}
