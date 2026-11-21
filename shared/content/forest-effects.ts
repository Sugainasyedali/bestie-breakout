import type { Board, Stage, Verdict } from "./engine.js";

const OFFSETS = (width: number) => [-width, 1, width, -1];

function tile(board: Board, pos: number) {
  const width = board.tiles[0].length;
  return pos < 0 ? "#" : board.tiles[Math.floor(pos / width)]?.[pos % width] ?? "#";
}

/** The guide can strike during the first second of each two-second echo. */
export const echoOpen = (elapsed: number) => elapsed % 2 < 1;

/**
 * Resolve only the special interactions. Undefined delegates to ordinary grid
 * movement and the existing shared goal/score checks.
 */
export function forestAction(stage: Stage, board: Board, actor: number, action: number, elapsed: number): Verdict | undefined {
  if (stage.mode !== "build" && stage.mode !== "gravity") return;
  const echo = stage.labels?.includes("Echo") && stage.mode === "build";
  const bounce = stage.labels?.includes("Bounce") && stage.mode === "gravity";
  if (!echo && !bounce) return;

  const runner = stage.role ?? 1;
  const guide = 1 - runner;
  const width = board.tiles[0].length;
  const stride = OFFSETS(width)[action];
  const start = board.actors[runner];
  const target = start + stride;
  const surface = tile(board, target);

  if (echo) {
    if (actor === guide) {
      if (action === 4 || surface !== "+") return "idle";
      if (!echoOpen(elapsed)) return "miss";
      board.armed = target;
      board.beat = elapsed;
      board.built = [target];
      board.both |= 1 << guide;
      return "move";
    }
    if (action < 4 && surface === "+") {
      const lit = board.armed === target && elapsed - board.beat <= 1.6;
      board.armed = -1;
      board.built = [];
      if (!lit) {
        board.actors[runner] = stage.map.join("").indexOf(runner ? "B" : "A");
        return "miss";
      }
      board.actors[runner] = target;
      return "move";
    }
    return;
  }

  if (actor === guide) {
    if (action !== 4) return "idle";
    board.switchOn = true;
    board.both |= 1 << guide;
    return "move";
  }
  if (action === 4 || surface !== "~") return;
  const landing = target + stride;
  const ground = tile(board, landing);
  const primed = board.switchOn;
  board.switchOn = false;
  if (!primed || ["#", "~", "+", "*"].includes(ground)) {
    board.actors[runner] = stage.map.join("").indexOf(runner ? "B" : "A");
    return "miss";
  }
  board.actors[runner] = landing;
  return ground === "G" ? "done" : "move";
}
