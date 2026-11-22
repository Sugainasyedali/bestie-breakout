"use client";
import {catalog} from "../../shared/catalog";
import {ChallengeControls} from "./challenge-controls";

import { useRef, useEffect, useState, type ReactNode } from "react";
import {
  Maximize,
  Minimize,
  Settings2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  MessageCircle,
  HelpCircle,
  X,
  Clock3,
  Star,
  Flag,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Hand,
  LogOut,
} from "lucide-react";
import { Arena } from "./arena";
import { arcadeAudio } from "./sound";
import {
  missions,
  chats,
  fruit,
  directions,
  toppings,
  type Input,
  type View,
  type Player,
} from "../../shared/model";
import "./mission.css";
const locales = [
  "Clockwork Keep",
  "Tinker Town",
  "Lantern Grove",
  "Starlight Arcade",
  "The Drift Isles",
  "Ember Kitchen",
];
const hooks = [
  "One holds the button. One saves the day!",
  "One crate. Four very nervous hands.",
  "One sees the trail. One takes the steps.",
  "One remembers. One presses their luck.",
  "Build a bridge. Trust your bestie.",
  "Two cooks. One very hungry kingdom.",
];
const reactions = ["😂", "😭", "🎉", "🤦", "😡", "💃", "🤔"];
type Props = {
  v: View;
  id: string;
  online: boolean;
  msg: string;
  command: (s: string) => void;
  send: (p: Input) => void;
  act: (n: number) => void;
  chat: (s: string) => void;
  loaded: (n: number) => void;
  leave: () => void;
  effects: boolean;
  toggleEffects: () => void;
};
function Tool({
  title,
  children,
  onClick,
  active = false,
}: {
  title: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className="gameTool"
      aria-label={title}
      title={title}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Seat({ p, num }: { p: Player; num: number }) {
  return (
    <div className={"pilot pilot" + num}>
      <i style={{ background: "#f8eace" }}>
        <svg viewBox="0 0 38 38" width="100%" height="100%" aria-hidden="true">
          <g stroke="#383043" strokeWidth="1.6" fill={p.color}>
            {p.shape === "Bunny" ? (
              <>
                <ellipse
                  cx="13"
                  cy="11"
                  rx="3"
                  ry="8"
                  transform="rotate(-13 13 11)"
                />
                <ellipse
                  cx="23"
                  cy="11"
                  rx="3"
                  ry="8"
                  transform="rotate(12 23 11)"
                />
              </>
            ) : (
              <path
                d="M18 17 Q10 13 10 7 Q18 6 19 13 Q19 4 29 6 Q28 14 18 17Z"
                fill="#80bc90"
              />
            )}
            <rect x="5" y="13" width="28" height="22" rx="10" />
            <path d="M16 24 Q19 28 22 24" fill="none" />
          </g>
          <g fill="#383043">
            <ellipse cx="13" cy="21" rx="1.4" ry="2" />
            <ellipse cx="25" cy="21" rx="1.4" ry="2" />
          </g>
          <text x="25" y="32" fontSize="7">
            {p.avatar}
          </text>
        </svg>
      </i>
      <span>
        <small>PLAYER 0{num}</small>
        <b>{p.name}</b>
      </span>
      <em
        className={p.online ? "connected" : ""}
        aria-label={p.online ? "Connected" : "Disconnected"}
      />
    </div>
  );
}
function Counter({ n }: { n: number }) {
  const [value, set] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      set(n);
      return;
    }
    let f = 0;
    const t = performance.now();
    function frame(now: number) {
      const p = Math.min(1, (now - t) / 700);
      set(Math.round(n * (1 - (1 - p) ** 3)));
      if (p < 1) f = requestAnimationFrame(frame);
    }
    f = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(f);
  }, [n]);
  return <strong>{value}</strong>;
}
export function MissionScreen({
  v,
  id,
  online,
  msg,
  command,
  send,
  act,
  chat,
  loaded,
  leave,
  effects,
  toggleEffects,
}: Props) {
  const root = useRef<HTMLElement>(null),
    direction = useRef(0),
    canvasLoaded = useRef(-1);
  const [full, F] = useState(false),
    [panel, open] = useState(""),
    [music, setMusic] = useState(false),
    [volume, setVolume] = useState(0.65),
    [notice, N] = useState("");
  const host = v.host === id,
    idx = v.players.findIndex((p) => p.id === id),
    m = v.mission,
    level=catalog[(v.level??m*6+1)-1],
    res = v.phase === "results",
    result = v.history.at(-1),
    win = !!result?.win;
  useEffect(()=>{let active=true;fetch('/api/player').then(r=>r.ok?r.json():null).then(data=>{if(!active||!data)return;const s=data.settings;sessionStorage.setItem('bestie-preferences',JSON.stringify(s));setMusic(s.music_enabled);arcadeAudio.setEffects(s.sound_enabled);arcadeAudio.setLevels(s.music_volume,s.sound_volume);setVolume(1);root.current?.setAttribute('data-controls',s.preferred_controls);root.current?.setAttribute('data-reduced',String(s.reduced_motion));window.dispatchEvent(new CustomEvent('bestie-preferences',{detail:s}))});return()=>{active=false}},[]);
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const change = () => F(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("fullscreenchange", change);
      arcadeAudio.scene(null, false);
    };
  }, []);
  useEffect(() => {
    open("");
    N("");
  }, [v.round, res]);
  useEffect(() => {
    arcadeAudio.setMusic(music);
    arcadeAudio.setVolume(volume);
    arcadeAudio.scene(
      res ? null : m,
      v.paused || !online || !!v.intro || v.players.some((p) => !p.online),
    );
  }, [
    music,
    volume,
    m,
    res,
    v.paused,
    online,
    !!v.intro,
    v.players.some((p) => !p.online),
  ]);
  useEffect(() => {
    if (online && canvasLoaded.current === v.round) loaded(v.round);
  }, [online, v.round]);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen)
        await root.current.requestFullscreen();
      else N("Browser fullscreen is unavailable on this device.");
    } catch {
      N("Your browser kept the game in windowed mode.");
    }
  }
  const togglePanel = (p: string) => open((old) => (old === p ? "" : p)),
    pause = () => {
      if (host) command("pause");
    };
  const role =
    m === 4
      ? idx === v.runner
        ? "Cross the moving bridge"
        : "Operate the bridge"
      : m === 2
        ? idx
          ? "Follow the scout"
          : "Guide the runner"
        : m === 3
          ? idx
            ? "Enter the code"
            : "Read the code"
          : m === 5
            ? idx
              ? "Prepare the pizza"
              : "Pick ingredients"
            : "";
  return (
    <main
      ref={root}
      className={"gameShell world" + m + (res ? " finished" : "")}
      onClickCapture={(e) => {
        if ((e.target as Element).closest("button")) {
          arcadeAudio.unlock();
          arcadeAudio.cue("click");
        }
      }}
    >
      <Arena
        key={v.round}
        v={v}
        id={id}
        send={send}
        act={(n) => act(n??-1)}
        pause={pause}
        emote={msg}
        ready={() => {
          canvasLoaded.current = v.round;
          loaded(v.round);
        }}
      />
      {!res ? (
        <>
          <div className="topLine">
            {v.players[0] && <Seat p={v.players[0]} num={1} />}
            <div className="missionPlate">
              <small>
                <Flag size={13} /> LEVEL {level.id} / 60
              </small>
              <h1>{level.title}</h1>
              <div className="dots">
                {missions.map((_, i) => (
                  <i key={i} className={i <= m ? "on" : ""} />
                ))}
              </div>
              <b className={"timePill " + (v.time < 15 ? "urgent" : "")}>
                <Clock3 size={15} />
                {Math.floor(Math.ceil(v.time) / 60)}:
                {String(Math.ceil(v.time) % 60).padStart(2, "0")}
              </b>
            </div>
            {v.players[1] && <Seat p={v.players[1]} num={2} />}
          </div>
          <div className="topTools">
            <Tool
              title={full ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={fullscreen}
            >
              {full ? <Minimize /> : <Maximize />}
            </Tool>
            <Tool
              title="Settings"
              onClick={() => togglePanel("settings")}
              active={panel === "settings"}
            >
              <Settings2 />
            </Tool>
          </div>
          {msg && (
            <div className="callout" role="status">
              {v.players.find((p) => p.id === msg.split("|")[0])?.name} ·{" "}
              {msg.split("|")[1]}
            </div>
          )}
          <div className="station">{v.board&&<div className="keyLegend">Arrows / WASD · 1–4 panels · E / Space tool</div>}
            {v.board&&level.challenge?<ChallengeControls stage={level.challenge.stages[v.board.stage]} board={v.board} seat={idx} act={act} time={level.limit-v.time}/>:<>
            {role && (
              <div className="roleTag">
                {role}
                {m === 3
                  ? " · " + v.progress + " entered"
                  : m === 5
                    ? " · " + v.progress + " served"
                    : ""}
              </div>
            )}
            {m === 2 && idx === 1 && (
              <div className="gameKeys">
                {directions.map((d, i) => (
                  <button key={d} onClick={() => act(i)}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            {m === 3 && (
              <div className="gameKeys">
                {idx === 0
                  ? v.sequence.map((n, i) => (
                      <span className={"signal signal" + n} key={i}>
                        {fruit[n]}
                      </span>
                    ))
                  : fruit.map((s, i) => (
                      <button
                        className={"signal signal" + i}
                        key={s}
                        onClick={() => act(i)}
                      >
                        {s}
                      </button>
                    ))}
              </div>
            )}
            {m === 5 && (
              <>
                <div className="orderSlip">
                  Order · {v.recipe.map((n) => toppings[n]).join(" + ")}
                  <br />
                  Pizza ·{" "}
                  {v.tray.map((n) => toppings[n]).join(" + ") || "Empty"}
                </div>
                <div className="gameKeys">
                  {toppings.map((s, i) => (
                    <button key={s} onClick={() => act(i)}>
                      {s} · {v.stock[i]}
                    </button>
                  ))}
                  {idx === 1 && <button onClick={() => act(4)}>Serve</button>}
                </div>
              </>
            )}
            {[0, 1, 4].includes(m) && (
              <>
                <div className="touchPad">
                  {[-1, 1].map((n) => (
                    <button
                      aria-label={n < 0 ? "Move left" : "Move right"}
                      key={n}
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        direction.current = n;
                        send({ move: n, jump: false });
                      }}
                      onLostPointerCapture={() => {
                        direction.current = 0;
                        send({ move: 0, jump: false });
                      }}
                    >
                      {n < 0 ? <ChevronLeft /> : <ChevronRight />}
                    </button>
                  ))}
                  <button
                    aria-label="Jump"
                    onPointerDown={() =>
                      send({ move: direction.current, jump: true })
                    }
                  >
                    <ArrowUp />
                  </button>
                  {m !== 1 && (
                    <button aria-label="Interact" onClick={() => act(-1)}>
                      <Hand />
                    </button>
                  )}
                </div>
                <div className="keyLegend">
                  <kbd>A</kbd>
                  <kbd>D</kbd> Move <kbd>Space</kbd> Jump{" "}
                  {m !== 1 && (
                    <>
                      <kbd>E</kbd> Interact
                    </>
                  )}
                </div>
              </>
            )}
            </>}
          </div>
          <div className="bottomLeft">
            <button className="chatToggle" onClick={() => togglePanel("chat")}>
              <MessageCircle size={17} /> Quick chat
            </button>
          </div>
          <div className="bottomRight">
            <Tool title="Mission hint" onClick={() => togglePanel("hint")}>
              <HelpCircle />
            </Tool>
            <Tool
              title={effects ? "Mute effects" : "Enable effects"}
              onClick={toggleEffects}
            >
              {effects ? <Volume2 /> : <VolumeX />}
            </Tool>
            {host && (
              <Tool
                title={v.paused ? "Resume" : "Pause"}
                onClick={() => command("pause")}
              >
                {v.paused ? <Play /> : <Pause />}
              </Tool>
            )}
          </div>
          {panel && (
            <aside className={"gameDrawer drawer-" + panel}>
              <div className="drawerTitle">
                <strong>
                  {
                    {
                      chat: "Quick chat",
                      settings: "Settings",
                      hint: "Mission hint",
                    }[panel]
                  }
                </strong>
                <Tool title="Close" onClick={() => open("")}>
                  <X />
                </Tool>
              </div>
              {panel === "chat" ? (
                <>
                  <select
                    aria-label="Send quick chat"
                    value=""
                    onChange={(e) => {
                      chat(e.target.value);
                      open("");
                    }}
                  >
                    <option value="">Choose a message</option>
                    {chats.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <div className="reactions">
                    {reactions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          chat(s);
                          open("");
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : panel === "hint" ? (
                <p>{level.objective}</p>
              ) : (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={effects}
                      onChange={toggleEffects}
                    />{" "}
                    Sound effects
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={music}
                      onChange={() => {
                        arcadeAudio.unlock();
                        setMusic(!music);
                      }}
                    />{" "}
                    Background music
                  </label>
                  <label>
                    Volume{" "}
                    <input
                      aria-label="Volume"
                      type="range"
                      min="0"
                      max="1"
                      step=".05"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                    />
                  </label>
                  <button onClick={leave}>
                    <LogOut size={15} /> Leave room
                  </button>
                </>
              )}
            </aside>
          )}
          {notice && (
            <button className="notice" onClick={() => N("")}>
              {notice} ×
            </button>
          )}
          {(v.intro > 0 ||
            v.paused ||
            !online ||
            v.players.some((p) => !p.online)) && (
            <div className="curtain">
              <div>
                <small>{locales[m]}</small>
                <h2>
                  {!online || v.players.some((p) => !p.online)
                    ? "Reconnecting…"
                    : v.paused
                      ? "Game paused"
                      : level.title}
                </h2>
                <p>{v.paused ? "Take a breather, besties." : level.objective}</p>
                {v.paused && host && (
                  <button onClick={() => command("pause")}>Resume game</button>
                )}
              </div>
            </div>
          )}
        </>
      ) : v.outro > 0 ? (
        <div className="curtain">
          <div>
            <small>{locales[m]}</small>
            <h2>{win ? "Mission complete!" : "Time ran out!"}</h2>
          </div>
        </div>
      ) : (
        result && (
          <div className={"resultScreen " + (win ? "won" : "lost")}>
            <div className="resultTicket">
              <small>
                {win ? "MISSION COMPLETE" : "TIME RAN OUT"} · {m + 1} / 6
              </small>
              <h2>{result.title}</h2><p>{v.saveStatus==="saved"?"Progress saved":v.saveStatus==="pending"?"Cloud save pending. Retrying…":"Guest progress lasts for this room."}</p>
              <p>
                {level.title} · {locales[m]}
              </p>
              <div className="awardStars">
                {[0, 1, 2].map((i) => (
                  <Star
                    key={i}
                    style={{ animationDelay: i * 100 + "ms" }}
                    fill={i < result.stars ? "#ffd05d" : "transparent"}
                  />
                ))}
              </div>
              <div className="resultStats">
                {[
                  ["Seconds", result.seconds],
                  ["Teamwork", result.score],
                  ["Mistakes", result.mistakes],
                ].map(([s, n]) => (
                  <div key={s}>
                    <Counter n={Number(n)} />
                    <small>{s}</small>
                  </div>
                ))}
              </div>
              {m === 5 && (
                <p>
                  Adventure total · {v.history.reduce((s, r) => s + r.stars, 0)}{" "}
                  / {catalog.length * 3} stars
                </p>
              )}
              {host ? (
                <div className="gameKeys">
                  {win && level.id < (v.maxLevel??60) && (
                    <button className="next" onClick={() => command("next")}>
                      Next mission
                    </button>
                  )}
                  <button onClick={() => command("again")}>Play again</button>
                  <button onClick={() => command("lobby")}>
                    Return to lobby
                  </button>
                </div>
              ) : (
                <p>Waiting for your host…</p>
              )}
            </div>
          </div>
        )
      )}
    </main>
  );
}
