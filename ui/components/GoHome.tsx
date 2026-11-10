"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Goes to the Sing page in place when a song is started from another page (lib/session.ts goHome): a full page
 *  load restarted the window's session, so "Starting OnKey…", the songs to try and "Getting ready…" each flashed
 *  before the lane. */
export default function GoHome() {
  const router = useRouter();
  useEffect(() => {
    const on = () => router.push("/");
    window.addEventListener("onkey-go-home", on);
    (window as unknown as { __onkeyGoHome?: boolean }).__onkeyGoHome = true;
    return () => window.removeEventListener("onkey-go-home", on);
  }, [router]);
  return null;
}
