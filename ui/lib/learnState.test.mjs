// npm test (node's own test runner; lib/learnState.ts is plain TypeScript, its types stripped)
import { test } from "node:test";
import assert from "node:assert/strict";
import { firstPlayGoing, learnNow, learnTakes } from "./learnState.ts";

const t = { id: "sp:1", name: "Yellow", artist: "Coldplay" };
const take = (status, mode = "learn") => ({ name: "Yellow", artist: "Coldplay", track_id: "sp:1", status, mode, score: null, live: null, report: null });
const song = (takesThen) => ({ mode: "learn", track: { ...t, album: "", duration: 200 }, learnTakes: learnTakes(takesThen, t) });

test("a first play is playing until its take ends", () => {
  const s = song([]);
  assert.equal(learnNow([], [], s, t)?.stage, "playing");
  assert.equal(learnNow([], [take("learning")], s, t)?.stage, "waiting");
  assert.equal(learnNow([], [take("learned")], s, t), null);        // learned: Sing, though the song is still shown
  assert.equal(learnNow([], [take("partly")], s, t), null);
});

test("an earlier play's take doesn't end this one", () => {
  const before = [take("partly")];
  const s = song(before);
  assert.equal(firstPlayGoing(s, before, t), true);
  assert.equal(firstPlayGoing(s, [...before, take("learned")], t), false);
});

test("sung takes don't count, and other songs aren't playing", () => {
  const s = song([]);
  assert.equal(firstPlayGoing(s, [take("done", "sing")], t), true);
  assert.equal(firstPlayGoing(s, [], { id: "sp:2", name: "Fix You", artist: "Coldplay" }), false);
  assert.equal(firstPlayGoing({ ...s, mode: "sing" }, [], t), false);
  assert.equal(firstPlayGoing(null, [], t), false);
});

test("a learner still running wins", () => {
  const job = { track_id: "sp:1", name: "Yellow", artist: "Coldplay", fraction: 0.4, stage: "words" };
  assert.equal(learnNow([job], [take("learned")], song([]), t), job);
});
