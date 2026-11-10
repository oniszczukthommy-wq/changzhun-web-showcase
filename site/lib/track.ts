/** A Plausible goal (cookieless; the website only). Does nothing without the script (local, blocked, not set up). */
export function track(event: string) {
  try {
    (window as unknown as { plausible?: (e: string) => void }).plausible?.(event);
  } catch {}
}
