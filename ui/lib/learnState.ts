// Whether a song is being learned, from the engine's events. Pure (no React, no engine), so
// lib/learnState.test.mjs can check it with `npm test`.
import type { LearnJob, SongState, Take } from "./session";

type Song = { id: string; name: string; artist: string };

// the same artist and title is the same song (a take may be by Spotify's id, the song kept by its ISRC)
export const sameSong = (a: { name: string; artist: string }, b: { name: string; artist: string }) =>
  a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.artist.trim().toLowerCase() === b.artist.trim().toLowerCase();

/** The learn going on for this song, if it's being learned (its learner running or waiting, or its take still being
 *  learned or scored): it can't be started again until that's done. */
export function learnOf(jobs: LearnJob[], takes: Take[], t: Song): LearnJob | null {
  const j = jobs.find(j => j.track_id === t.id) ?? jobs.find(j => sameSong(j, t));
  if (j) return j;
  const k = takes.find(k => (k.status === "learning" || k.status === "scoring") && (k.track_id === t.id || sameSong(k, t)));
  return k ? { track_id: t.id, name: t.name, artist: t.artist, fraction: null, stage: k.status === "scoring" ? "scoring" : "waiting" } : null;
}

/** First-play takes of this song in the list (a first play ends as one; sung takes can drop out of the list). */
export const learnTakes = (takes: Take[], t: Song) =>
  takes.filter(k => k.mode !== "sing" && (k.track_id === t.id || sameSong(k, t))).length;

/** This song's first play is still playing: it's the song shown, being learned, and no take of it has ended since
 *  it started (the engine keeps the song shown until the next one starts, so after the play it would otherwise
 *  still look like it's playing). */
export function firstPlayGoing(song: Pick<SongState, "mode" | "track" | "learnTakes"> | null, takes: Take[], t: Song): boolean {
  return song?.mode === "learn" && song.track.id === t.id && learnTakes(takes, t) <= (song.learnTakes ?? 0);
}

/** The learn going on for this song (see learnOf), also while its first play is still playing; null when it can
 *  be sung. Library, History, Song and Take pages all use this. */
export function learnNow(jobs: LearnJob[], takes: Take[], song: Pick<SongState, "mode" | "track" | "learnTakes"> | null, t: Song): LearnJob | null {
  return learnOf(jobs, takes, t) ?? (firstPlayGoing(song, takes, t)
    ? { track_id: t.id, name: t.name, artist: t.artist, fraction: null, stage: "playing" } : null);
}
