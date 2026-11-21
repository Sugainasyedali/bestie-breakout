import {catalog} from "../../shared/catalog.js";
import {initBoard,boardAction} from "../../shared/content/engine.js";
import { randomInt } from "node:crypto";
import { bridgeCenter, type Input, type View } from "../../shared/model.js";
export const limits = [90, 100, 80, 90, 100, 60];
export function start(v: View, mission: number,level=mission*6+1) {
  Object.assign(v, {
    mission,
    round: (v.round || 0) + 1,
    intro: 1.8,
    outro: 0,
    phase: "game",
    level,board:catalog[level-1].challenge?initBoard(catalog[level-1].challenge!.stages[0],0):undefined,saveStatus:undefined,
    time: catalog[level-1].limit,
    progress: 0,
    mistakes: 0,
    correct: 0,
    keyTaken: false,
    gate: false,
    relay: false,
    box: 160,
    bridge: false,
    runner: 1,
    recipe: roll(3),
    stock: [0, 0, 0, 0],
    tray: [],
    sequence: roll(3),
    maze: [],
    cell: 0,
    paused: false,
  });
  let x = 0,
    y = 0;
  v.maze = [0];
  while (x < 5 || y < 3) {
    if (x < 5 && (y === 3 || randomInt(2))) x++;
    else y++;
    v.maze.push(y * 6 + x);
  }
  v.players.forEach((p, i) =>
    Object.assign(p, {
      x: mission === 1 ? 128 + i * 64 : 72 + i * 48,
      y: 278,
      vy: 0,
      ground: true,
      dir: 1,
    }),
  );
}
function roll(n: number) {
  return Array.from({ length: n }, () => randomInt(4));
}
export function finish(v: View, win: boolean) {
  if (v.phase !== "game") return;
  const seconds = Math.round((catalog[(v.level??(v.mission*6+1))-1].limit) - v.time);
  const score = Math.max(
    0,
    Math.min(
      100,
      (win ? 60 : 10) +
        Math.min(30, v.correct * 10) +
        Math.round((10 * v.time) / (catalog[(v.level??(v.mission*6+1))-1].limit)) -
        v.mistakes * 4,
    ),
  );
  v.history.push({
    mission: v.mission,
    win,
    seconds,
    mistakes: v.mistakes,
    correct: v.correct,
    score,
    stars: win ? (score >= 85 ? 3 : score >= 65 ? 2 : 1) : 0,
    title: !win
      ? "Professional Disasters"
      : score >= 85
        ? "Two Legends, One Braincell"
        : v.mistakes > 3
          ? "Somehow We Survived"
          : "Certified Chaos Duo",
  });
  v.outro = 1.15;
  v.phase = "results";
}
export function action(v: View, i: number, n: number) {
  if (v.phase !== "game" || v.paused || !Number.isInteger(n)) return;
  if(v.board && v.level){const ch=catalog[v.level-1].challenge!,b=v.board;const verdict=boardAction(ch.stages[b.stage],b,i,n,ch.limit-v.time);
 if(verdict==="miss")v.mistakes++;if(verdict==="done"){v.correct++;v.progress++;if(b.stage+1===ch.stages.length)finish(v,true);else v.board=initBoard(ch.stages[b.stage+1],b.stage+1)}return}
  const p = v.players[i];
  switch (v.mission) {
    case 0:
      if (p.x > 500 && p.x < 650 && !v.relay) {
        v.relay = true;
        v.correct++;
      }
      break;
    case 2: {
      if (i !== 1 || n < 0 || n > 3) return;
      const next = v.cell + [-6, 1, 6, -1][n];
      if (next === v.maze[v.progress + 1]) {
        v.cell = next;
        v.progress++;
        v.correct++;
        if (next === 23) finish(v, true);
      } else v.mistakes++;
      break;
    }
    case 3:
      if (i !== 1 || n < 0 || n > 3) return;
      if (n === v.sequence[v.progress]) {
        v.progress++;
        v.correct++;
        if (v.progress === v.sequence.length) {
          if (v.sequence.length === 5) finish(v, true);
          else {
            v.sequence = roll(v.sequence.length + 1);
            v.progress = 0;
          }
        }
      } else {
        v.mistakes++;
        v.progress = 0;
      }
      break;
    case 4:
      if (i !== v.runner && n === -1) v.bridge = !v.bridge;
      break;
    case 5:
      if (n >= 0 && n < 4) {
        if (i === 0) v.stock[n] = Math.min(9, v.stock[n] + 1);
        else if (v.stock[n] > 0 && v.tray.length < 3) {
          v.stock[n]--;
          v.tray.push(n);
        }
      } else if (i === 1 && n === 4) {
        if (v.tray.length === 3 && v.tray.every((a, k) => a === v.recipe[k])) {
          v.correct += 3;
          v.progress++;
          v.recipe = roll(3);
        } else v.mistakes++;
        v.tray = [];
      }
      break;
  }
}
export function tick(v: View, inputs: Input[], dt: number) {
  if (v.phase !== "game" || v.paused || !v.players.every((p) => p.online))
    return;
  v.time = Math.max(0, v.time - dt);
  if (!v.time) {
    finish(v, !v.board && v.mission === 5 && v.progress > 0);
    return;
  }
  if(v.board)return;
  if (![0, 1, 4].includes(v.mission)) return;
  const wasOpen = v.gate;
  v.gate =
    v.relay || v.players.some((p) => Math.abs(p.x - 220) < 32 && p.ground);
  if (v.mission === 0 && v.gate && !wasOpen && !v.correct) v.correct++;
  v.players.forEach((p, i) => {
    const input = inputs[i] || { move: 0, jump: false },
      old = p.x;
    if (input.jump && p.ground) {
      p.vy = -370;
      p.ground = false;
    }
    input.jump = false;
    if (input.move) p.dir = input.move;
    p.x = Math.max(18, Math.min(780, p.x + input.move * 185 * dt));
    const walls =
      v.mission === 0
        ? [[330, 42], ...(v.gate ? [] : [[475, 150]])]
        : v.mission === 1
          ? [
              [350, 28],
              [565, 28],
            ]
          : [];
    for (const [x, h] of walls)
      if (p.y > 278 - h + 1 && Math.abs(p.x - x) < 22) p.x = old;
    const aboveBridge =
      v.bridge && Math.abs(p.x - bridgeCenter(v.time)) < 75 && p.y <= 281;
    if (v.mission === 4 && p.ground && aboveBridge && p.x > 260 && p.x < 540)
      p.x += bridgeCenter(v.time) - bridgeCenter(v.time + dt);
    const floor =
      v.mission === 4 && p.x > 260 && p.x < 540 && !aboveBridge
        ? 450
        : Math.min(
            278,
            ...walls
              .filter(([x, h]) => Math.abs(p.x - x) < 22 && p.y <= 279 - h)
              .map(([, h]) => 278 - h),
          );
    p.vy += 900 * dt;
    p.y += p.vy * dt;
    p.ground = p.y >= floor;
    if (p.ground) {
      p.y = floor;
      p.vy = 0;
    }
    if (p.y > 345) {
      p.x = 95;
      p.y = 278;
      p.vy = 0;
      v.mistakes++;
    }
  });
  if (
    v.mission === 0 &&
    !v.keyTaken &&
    v.players.some((p) => Math.abs(p.x - 665) < 24 && p.y < 252)
  ) {
    v.keyTaken = true;
    v.correct++;
  }
  if (v.mission === 0 && v.relay && v.players.every((p) => p.x > 720)) {
    v.correct++;
    finish(v, true);
  }
  if (v.mission === 1) {
    const [a, b] = v.players;
    if (
      Math.abs((a.x + b.x) / 2 - v.box) < 65 &&
      Math.abs(a.x - b.x) < 105 &&
      Math.abs(a.y - b.y) < 55 &&
      inputs[0]?.move === inputs[1]?.move
    )
      v.box = (a.x + b.x) / 2;
    else if (Math.max(Math.abs(a.x - v.box), Math.abs(b.x - v.box)) > 100) {
      v.mistakes++;
      v.players.forEach((p, i) => {
        p.x = v.box - 32 + i * 64;
        p.y = 230;
        p.vy = 0;
      });
    }
    v.correct = Math.max(v.correct, Math.floor((v.box - 150) / 120));
    if (v.box > 720) finish(v, true);
  }
  if (v.mission === 4 && v.players[v.runner].x > 720) {
    if (!v.progress) {
      v.runner = 0;
      v.bridge = false;
      v.progress++;
      v.correct++;
    } else if (v.players.every((p) => p.x > 720)) {
      v.correct += 2;
      finish(v, true);
    }
  }
}
