"use client";

import { useEffect, useRef } from "react";
import { cellAt, type Board, type Stage } from "../../shared/content/engine";
import { echoOpen } from "../../shared/content/forest-effects";
import { arcadeAudio } from "./sound";

type Props = {
  stage: Stage;
  board: Board;
  seat: number;
  act: (n: number) => void;
  /** Authoritative seconds elapsed, including earlier stages of this challenge. */
  time: number;
};

const directions = ["Up", "Right", "Down", "Left"];
const tools = {
  wind: "Fan",
  gravity: "Inverter",
  route: "Gate",
  build: "Bridge",
} as const;

export function ChallengeControls({ stage, board, seat, act, time }: Props) {
  const { mode } = stage;
  const runner = stage.role ?? 1;
  const guide = 1 - runner;
  const guiding = seat === guide;
  const echo = mode === "build" && stage.labels?.includes("Echo");
  const bounce = mode === "gravity" && stage.labels?.includes("Bounce");
  const pulse = Math.floor(time * 2) % 4;
  const bar = Math.floor(time / 2);
  const previousBar = useRef(-1);
  useEffect(() => {
    if ((echo || mode === "rhythm") && bar !== previousBar.current) {
      previousBar.current = bar;
      arcadeAudio.cue("switch");
    }
  }, [bar, echo, mode]);

  if (seat !== 0 && seat !== 1) return null;

  function directionKeys(prefix = "", allowed?: number) {
    return directions.map((label, d) => (
      <button
        key={label}
        aria-label={prefix ? prefix + " " + label.toLowerCase() : label}
        disabled={allowed !== undefined && allowed !== d}
        onClick={() => act(d)}
      >
        {label}
      </button>
    ));
  }

  if (mode === "sequence" || mode === "rhythm") {
    const labels = stage.labels ?? ["Circle", "Star", "Heart", "Diamond"];
    const sender = mode === "rhythm" ? board.step % 2 : guide;
    const calling = seat === sender;
    const resting = mode === "rhythm" && pulse === 3;
    const hasClue = board.code.length > 0 && board.code[board.step] >= 0;
    const sent = board.sent >= 0;
    const cue = sent ? labels[board.sent] : "";
    const prompt = calling
      ? sent ? "Waiting for partner to match " + cue : "Send the next symbol"
      : !sent ? "Waiting for your partner’s signal" : "Confirm the symbol your partner called";
    return (
      <>
        <div className="roleTag">{prompt} · {board.step} matched</div>
        {hasClue && calling && (
          <div className="orderSlip">
            Your clue · {labels[board.code[board.step]]}
          </div>
        )}
        {mode === "rhythm" && <div className="orderSlip">Beat {pulse + 1} / 4 · {resting ? "Rest" : "Play"}</div>}
        <div className="gameKeys">
          {labels.map((label, i) => (
            <button
              key={label}
              className={"signal signal" + i}
              aria-label={(calling ? "Send " : "Match ") + label}
              disabled={!calling && (!sent || resting)}
              onClick={() => act(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (mode === "mirrors") {
    const canFire = seat === runner && Boolean(board.both & (1 << guide));
    return (
      <>
        <div className="roleTag">
          {guiding ? "Turn your mirrors to guide the beam" : "Turn your mirrors, then fire at the receiver"}
        </div>
        <div className="gameKeys">
          {board.mirrors.map((position, i) => (
            <button
              key={position}
              disabled={board.mirrors.length > 1 && i % 2 !== seat}
              onClick={() => act(i)}
              aria-label={"Rotate mirror " + (i + 1)}
            >
              M{i + 1} · {cellAt(board, position)}
            </button>
          ))}
          {seat === runner && <button disabled={!canFire} onClick={() => act(4)}>Fire beam</button>}
        </div>
      </>
    );
  }

  if (mode === "pads") {
    const target = seat === 0 ? "a" : "b";
    const onPad = cellAt(board, board.actors[seat]) === target;
    const mirrored = seat === 1 && stage.labels?.includes("Mirror");
    return (
      <>
        <div className="roleTag">
          {onPad ? "Plate engaged · Stay here" : "Reach plate " + target.toUpperCase()}
          {mirrored && " · Left and right are reversed"}
        </div>
        <div className="gameKeys">{directionKeys("Move")}</div>
      </>
    );
  }

  if (mode === "cargo" || mode === "conveyor" || mode === "magnet") {
    const mine = board.armed === seat;
    const partner = board.armed === 1 - seat;
    return (
      <>
        <div className="roleTag">
          {partner ? (mode === "magnet" ? "Magnet live · Step toward the core to push, or away to pull" : "Partner ready · Move into the cargo to push") :
            mine ? "You are bracing · Partner can push" :
              "One player braces. The other pushes."}
        </div>
        <div className="gameKeys">
          {directionKeys("Move")}
          <button disabled={mine} onClick={() => act(4)}>
            {mode === "magnet" ? "Energize magnet" : "Brace cargo"}
          </button>
        </div>
      </>
    );
  }

  const tool = tools[mode];
  let status: string;
  if (mode === "route") {
    status = board.held >= 0
      ? "Signal · " + directions[board.held]
      : guiding ? "Signal the runner’s next step" : "Wait for a direction signal";
  } else if (bounce) {
    status = board.switchOn ? "Mushroom primed · Jump across" :
      guiding ? "Prime a mushroom before each bounce" : "Wait for lift at each mushroom";
  } else if (echo) {
    const lit = board.armed >= 0 && time - board.beat <= 1.6;
    status = lit ? "Plank ringing · Cross now" : echoOpen(time) ?
      (guiding ? "Strike the plank beside your partner" : "Call the gap direction") : "Listen for the chime";
  } else if (mode === "build") {
    status = (guiding ? "Place a plank beside your partner" : "Cross the completed spans") +
      " · " + board.built.length + " built";
  } else {
    status = tool + (board.switchOn ? " on" : " off") +
      (mode === "gravity" && board.switchOn ? " · Up and down are reversed" : guiding ? " · Listen to your partner" : " · Steer to the goal");
  }
  const aim = mode === "route" || mode === "build";
  const gatedRoute = mode === "route" && board.tiles.some((row) => /[*+~]/.test(row));
  const activate = guiding && (mode === "wind" || mode === "gravity" || gatedRoute);
  return (
    <>
      <div className="roleTag">{status}</div>
      <div className="gameKeys">
        {guiding && aim && directionKeys(mode === "route" ? "Signal" : "Build")}
        {!guiding && directionKeys("Move", mode === "route" ? board.held : undefined)}
        {activate && (
          <button disabled={Boolean(bounce && board.switchOn)} onClick={() => act(4)}>
            {bounce ? "Prime mushroom" : tool + (board.switchOn ? " off" : " on")}
          </button>
        )}
      </div>
    </>
  );
}
