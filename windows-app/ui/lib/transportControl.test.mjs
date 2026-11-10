import { test } from "node:test";
import assert from "node:assert/strict";
import { control } from "./session.ts";

test("the play button sends playpause and shows a refused QQ command", async () => {
  const prior = globalThis.window;
  const fake = new EventTarget();
  const calls = [];
  fake.__TAURI_INTERNALS__ = {
    invoke: async (cmd, args) => {
      calls.push({ cmd, args });
      return { ok: false, error: "QQ 音乐没有响应" };
    },
  };
  globalThis.window = fake;
  let error = "";
  fake.addEventListener("onkey-control-error", e => { error = e.detail; });
  try {
    await control("playpause");
    assert.deepEqual(calls, [{ cmd: "player_control", args: { action: "playpause" } }]);
    assert.equal(error, "QQ 音乐没有响应");
  } finally {
    globalThis.window = prior;
  }
});
