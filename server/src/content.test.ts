import assert from "node:assert/strict";
import test from "node:test";
import { levels as castle } from "../../shared/content/castle.js";
import { levels as toy } from "../../shared/content/toy.js";
import { levels as woods } from "../../shared/content/woods.js";
import { levels as arcade } from "../../shared/content/arcade.js";
import { levels as cloud } from "../../shared/content/cloud.js";
import { levels as pizza } from "../../shared/content/pizza.js";
import {
  boardAction, cellAt, initBoard,
  type Board, type Stage,
} from "../../shared/content/engine.js";

import {catalog} from '../../shared/catalog.js';

type Press = [seat: number, button: number];
type SearchNode = { board: Board; parent: number; presses: Press[] };
const directions = [0, 1, 2, 3];
const worlds = [castle, toy, woods, arcade, cloud, pizza];

/**
 * Find a concrete sequence of legal player messages. Keep parent pointers so
 * branching freight puzzles can be explored without copying every route prefix.
 */
function search(
  stage: Stage,
  start: Board,
  choices: (state: Board) => Press[][],
  key: (state: Board) => string,
  target?: (state: Board) => boolean,
): Press[] {
  const queue: SearchNode[] = [{ board: start, parent: -1, presses: [] }];
  const seen = new Set([key(start)]);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head].board;
    for (const presses of choices(current)) {
      const next = structuredClone(current);
      let done = false;
      for (const [seat, button] of presses) {
        done = boardAction(stage, next, seat, button, 0) === "done";
        if (done) break;
      }
      if (done || target?.(next)) {
        const parts = [presses];
        for (let i = head; i > 0; i = queue[i].parent) parts.push(queue[i].presses);
        return parts.reverse().flat();
      }
      const state = key(next);
      if (seen.has(state)) continue;
      seen.add(state);
      queue.push({ board: next, parent: head, presses });
    }
  }
  assert.fail('No winning move sequence.\n' + stage.map.join('\n'));
}

function solution(s: Stage, board: Board): Press[] {
  const runner = s.role ?? 1;
  const guide = 1 - runner;
  if (s.mode === "sequence" || s.mode === "rhythm") {
    return board.code.flatMap((symbol, i): Press[] => {
      const sender = s.mode === "rhythm" ? i % 2 : guide;
      return [[sender, symbol], [1 - sender, symbol]];
    });
  }
  if (s.mode === "mirrors") {
    return search(s, board, state => [
      ...state.mirrors.map((_, i): Press[] => [[i % 2, i]]),
      [[runner, 4]],
    ], state => JSON.stringify([state.both, state.tiles]));
  }
  if (s.mode === "pads") {
    const working = structuredClone(board);
    const trace: Press[] = [];
    for (const seat of [0, 1]) {
      const route = search(s, working,
        () => directions.map((dir): Press[] => [[seat, dir]]),
        b => String(b.actors[seat]),
        b => cellAt(b, b.actors[seat]) === (seat ? "b" : "a"));
      trace.push(...route);
      for (const [i, n] of route) boardAction(s, working, i, n, 0);
    }
    return trace;
  }
  if (["cargo", "magnet", "conveyor"].includes(s.mode)) {
    return search(s, board,
      () => directions.map((dir): Press[] => [[1, 4], [0, dir]]),
      b => JSON.stringify([b.actors[0], b.box, b.switchOn, b.armed]));
  }
  return search(s, board, () => [
    [[guide, 4]],
    ...directions.map((dir): Press[] =>
      s.mode === "route" || s.mode === "build"
        ? [[guide, dir], [runner, dir]]
        : [[runner, dir]]),
  ], b => JSON.stringify([b.actors[runner], b.both, b.built, b.switchOn, b.held]));
}

test("each world adds exactly five uniquely named challenges", () => {
  assert.deepEqual(worlds.map(levels => levels.length), [5, 5, 5, 5, 5, 5]);
  assert.equal(new Set(worlds.flat().map(level => level.title)).size, 30);
});

for (const level of [...worlds.flat(), ...catalog.slice(36).map(l=>l.challenge!)]) {
  test(level.title + " reaches the authoritative win state from both starting seats", () => {
    assert.ok(level.limit > 0 && level.stages.length > 0);
    for (const [index, s] of level.stages.entries()) {
      const rows = s.map.join("");
      assert.ok(s.map.every(row => row.length === s.map[0].length), "ragged board");
      for (const player of ["A", "B"]) assert.equal(rows.split(player).length, 2);
      const symbols = s.mode === "sequence" || s.mode === "rhythm";
      // All four randomized clue rotations must yield a playable round.
      for (const random of symbols ? [0, 0.25, 0.5, 0.75] : [0]) {
        const board = initBoard(s, index, () => random);
        const trace = solution(s, board);
        assert.equal(new Set(trace.map(([seat]) => seat)).size, 2, "both seats must participate");
        // Removing either side of a known winning conversation must prevent
        // completion even when the other client sends the exact winning inputs.
        for (const solo of [0, 1]) {
          const isolated = initBoard(s, index, () => random);
          for (const [seat, button] of trace) {
            if (seat === solo) assert.notEqual(boardAction(s, isolated, seat, button, 0), "done");
          }
        }
        let result;
        for (const [seat, button] of trace) result = boardAction(s, board, seat, button, 0);
        assert.equal(result, "done", "stage " + (index + 1) + ", inputs " + JSON.stringify(trace));
      }
    }
  });
}
