import test from "node:test";
import assert from "node:assert/strict";
import { type View, type Player } from "../../shared/model.js";
import { start, tick, action } from "./game.js";
function room(m: number) {
  const v = {
    players: [{ online: true }, { online: true }] as Player[],
    history: [],
  } as unknown as View;
  start(v, m);
  return v;
}
test("pressure pad closes, relay latches and both players must exit", () => {
  const v = room(0);
  v.players[0].x = 220;
  tick(v, [], 0.025);
  assert.equal(v.gate, true);
  v.players[0].x = 125;
  tick(v, [], 0.025);
  assert.equal(v.gate, false);
  action(v, 0, -1);
  assert.equal(v.relay, false);
  v.players[1].x = 560;
  action(v, 1, -1);
  v.players.forEach((p) => (p.x = 750));
  tick(v, [], 0.025);
  assert.equal(v.history[0].win, true);
});
test("cargo rejects separation and rewards synchronized transport", () => {
  const v = room(1);
  v.players[1].x = 400;
  tick(v, [], 0.025);
  assert.equal(v.mistakes, 1);
  const inputs = [
    { move: 1, jump: false },
    { move: 1, jump: false },
  ];
  for (let i = 0; i < 350 && v.phase === "game"; i++) {
    if (
      [350, 565].some((x) => v.players[1].x > x - 90 && v.players[1].x < x - 80)
    ) {
      inputs.forEach((p) => (p.jump = true));
    }
    tick(v, inputs, 0.025);
  }
  assert.equal(v.history[0]?.win, true);
});
test("maze navigator sees route and runner completes it", () => {
  const v = room(2);
  action(v, 0, 1);
  assert.equal(v.cell, 0);
  for (const next of v.maze.slice(1)) action(v, 1, next - v.cell === 6 ? 2 : 1);
  assert.equal(v.history[0].win, true);
});
test("only operator enters increasingly long codes", () => {
  const v = room(3);
  action(v, 0, v.sequence[0]);
  assert.equal(v.progress, 0);
  for (let r = 0; r < 3; r++) for (const n of [...v.sequence]) action(v, 1, n);
  assert.equal(v.correct, 12);
  assert.equal(v.history[0].win, true);
});
test("bridge alternates crossing roles", () => {
  const v = room(4);
  action(v, 1, -1);
  assert.equal(v.bridge, false);
  action(v, 0, -1);
  v.players[1].x = 740;
  tick(v, [], 0.025);
  assert.equal(v.runner, 0);
  action(v, 1, -1);
  v.players[0].x = 745;
  tick(v, [], 0.025);
  assert.equal(v.history[0].win, true);
});
test("pizza requires stock and correct recipe before closing", () => {
  const v = room(5);
  action(v, 1, 0);
  assert.deepEqual(v.tray, []);
  action(v, 1, 4);
  assert.equal(v.mistakes, 1);
  for (const n of v.recipe) {
    action(v, 0, n);
    action(v, 1, n);
  }
  action(v, 1, 4);
  assert.equal(v.progress, 1);
  tick(v, [], 60);
  assert.equal(v.history[0].win, true);
});

test("an offline teammate or paused session freezes the clock and movement", () => {
  const v = room(0);
  const x = v.players[0].x,
    time = v.time;
  v.players[1].online = false;
  tick(v, [{ move: 1, jump: true }], 1);
  assert.equal(v.time, time);
  assert.equal(v.players[0].x, x);
  v.players[1].online = true;
  v.paused = true;
  tick(v, [{ move: 1, jump: true }], 1);
  assert.equal(v.time, time);
  assert.equal(v.players[0].x, x);
});
test("unassisted crossing falls, while a timed crossing can finish both bridge sections", () => {
  const v = room(4);
  v.players[1].x = 350;
  for (let f = 0; f < 30; f++) tick(v, [], 0.025);
  assert.equal(v.mistakes, 1);
  for (const runner of [1, 0]) {
    action(v, 1 - runner, -1);
    const inputs = [
      { move: 0, jump: false },
      { move: 0, jump: false },
    ];
    inputs[runner].move = 1;
    for (let f = 0; f < 450 && v.phase === "game" && v.runner === runner; f++) {
      const p = v.players[runner];
      inputs[runner].jump =
        p.ground && ((p.x >= 240 && p.x <= 260) || (p.x >= 399 && p.x <= 530));
      tick(v, inputs, 0.025);
    }
  }
  assert.equal(v.history[0]?.win, true);
});
