"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Gamepad2,
  Volume2,
  VolumeX,
  Users,
  Flag,
  Play,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  LockKeyhole,
  Radio,
  Star,
  Pause,
  LogOut,
} from "lucide-react";
import { Arena } from "./arena";
import {
  missions,
  chats,
  fruit,
  toppings,
  directions,
  type View,
  type Profile,
  type ServerEvents,
  type ClientEvents,
  type Input,
  type Ack,
} from "../../shared/model";
const colors = ["#ff99af", "#88deca", "#b8a0ed", "#f5c663"];
const initial: Profile = {
  name: "",
  color: colors[0],
  shape: "Bunny",
  avatar: "★",
};
function Avatar({ p }: { p: Profile }) {
  return (
    <span
      className={"avatar " + (p.shape === "Bunny" ? "bunny" : "sprout")}
      style={{ background: p.color }}
    >
      <i />
      <b>•‿•</b>
      <small>{p.avatar}</small>
    </span>
  );
}
export default function Home() {
  const [screen, S] = useState("home"),
    [profile, P] = useState(initial),
    [code, C] = useState(""),
    [v, V] = useState<View | null>(null),
    [id, I] = useState(""),
    [error, E] = useState(""),
    [online, O] = useState(false),
    [sound, U] = useState(false),
    [msg, M] = useState(""),
    [copied, Cp] = useState(false);
  const touchDirection = useRef(0),
    previous = useRef<View | null>(null);
  const sock = useRef<Socket<ServerEvents, ClientEvents> | null>(null),
    soundRef = useRef(false),
    ctx = useRef<AudioContext | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function beep(n: number) {
    if (!soundRef.current) return;
    const a = ctx.current;
    if (!a) return;
    const osc = a.createOscillator(),
      gain = a.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(n, a.currentTime);
    osc.frequency.exponentialRampToValueAtTime(n * 0.75, a.currentTime + 0.12);
    gain.gain.setValueAtTime(0.045, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(a.destination);
    osc.start();
    osc.stop(a.currentTime + 0.17);
  }
  function toggle() {
    const b = !sound;
    U(b);
    soundRef.current = b;
    if (b) {
      ctx.current ??= new AudioContext();
      void ctx.current.resume();
      beep(600);
    }
  }
  useEffect(() => {
    if (!sound || v?.phase !== "game" || v.paused) return;
    let j = 0;
    const t = setInterval(
      () => beep([196, 247, 294, 247, 220, 262, 330, 262][j++ % 8]),
      740,
    );
    return () => clearInterval(t);
  }, [sound, v?.phase, v?.paused]);
  useEffect(() => {
    if (v?.phase === "results") beep(v.history.at(-1)?.win ? 880 : 150);
  }, [v?.phase]);
  useEffect(() => {
    const saved = localStorage.getItem("bestie-profile");
    if (saved)
      try {
        P(JSON.parse(saved));
      } catch {}
    if (sessionStorage.getItem("bestie-seat")) S("setup");
  }, []);
  useEffect(() => {
    if (screen === "home") return;
    const s: Socket<ServerEvents, ClientEvents> = io(
      process.env.NEXT_PUBLIC_SERVER_URL || undefined,
      { transports: ["polling"], autoConnect: false },
    );
    sock.current = s;
    s.on("connect", () => {
      O(true);
      E("");
      const saved = sessionStorage.getItem("bestie-seat");
      if (saved)
        s.emit("restore", JSON.parse(saved), (r) => {
          if (r.error) {
            sessionStorage.removeItem("bestie-seat");
            V(null);
            E(r.error);
          } else I(r.id!);
        });
    });
    s.on("connect_error", () => {
      O(false);
      E("Game server is unreachable. Reconnecting…");
    });
    s.on("disconnect", () => O(false));
    s.on("state", (next) => {
      const old = previous.current;
      if (old?.phase === "game" && next.phase === "game") {
        if (next.mistakes > old.mistakes) beep(130);
        else if (next.keyTaken && !old.keyTaken) beep(920);
        else if (next.gate && !old.gate) beep(530);
        else if (next.correct > old.correct) beep(720);
      }
      previous.current = next;
      V(next);
    });
    s.on("message", (m) => {
      M(m.id + "|" + m.text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => M(""), 3200);
      beep(560);
    });
    s.connect();
    return () => {
      clearTimeout(timer.current);
      s.disconnect();
      sock.current = null;
    };
  }, [screen]);
  function enter(join: boolean) {
    E("");
    if (!profile.name.trim()) return E("Give your bestie a nickname first.");
    if (join && !/^[a-f0-9]{6}$/i.test(code))
      return E("Enter the six-character room code.");
    localStorage.setItem("bestie-profile", JSON.stringify(profile));
    const ack: Ack = (r) => {
      if (r.error) return E(r.error);
      I(r.id!);
      sessionStorage.setItem(
        "bestie-seat",
        JSON.stringify({ code: r.code, token: r.token }),
      );
    };
    if (join) sock.current?.emit("join", { code, profile }, ack);
    else sock.current?.emit("create", profile, ack);
  }
  const command = (c: string) => sock.current?.emit("command", c),
    act = (n: number) => {
      sock.current?.emit("action", n);
      beep(380);
    },
    send = (p: Input) => sock.current?.emit("input", p),
    isHost = id === v?.host,
    idx = v?.players.findIndex((p) => p.id === id) ?? 0;
  function leave() {
    if (v && !confirm("Leave your room and end this session?")) return;
    command("leave");
    sessionStorage.removeItem("bestie-seat");
    V(null);
    S("home");
    E("");
  }
  const how = (
    <section id="how" className="how">
      <div>
        <BookOpen size={19} /> <strong>How to play</strong>
      </div>
      <p>
        Pick your character. Share a private room code. Ready up together and
        talk your way through six missions.
      </p>
    </section>
  );
  return (
    <>
      <header>
        <div className="wrap nav">
          <button className="brand" onClick={leave}>
            <span>
              <Gamepad2 />
            </span>{" "}
            BESTIE BREAKOUT
          </button>
          <div className="navright">
            <span className="arcade">
              <i /> CO-OP ARCADE
            </span>
            <button
              className="audio"
              aria-label={"Turn sound " + (sound ? "off" : "on")}
              onClick={toggle}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </header>
      <main className="wrap">
        {screen === "home" ? (
          <>
            <section className="hero">
              <div className="heroText">
                <span className="label">
                  <i /> ONLINE CO-OP GAME
                </span>
                <h1>
                  BESTIE
                  <br />
                  <em>BREAKOUT!</em>
                </h1>
                <h2>
                  Two Brains. One Mission.
                  <br />
                  Unlimited Disasters.
                </h2>
                <p>
                  Grab a friend and escape six ridiculous missions. Push
                  buttons, drop boxes, and try to stay besties.
                </p>
                <div className="buttons">
                  <button className="primary" onClick={() => S("setup")}>
                    <Play size={19} fill="currentColor" /> Play now
                  </button>
                  <a className="secondary" href="#how">
                    <BookOpen size={18} /> How to play
                  </a>
                </div>
              </div>
              <div className="heroArt">
                <img
                  src="/art/hero.svg"
                  alt="Pink and mint besties leap across floating islands toward a golden key"
                />
                <span className="artLabel">
                  <Users size={16} /> 2-PLAYER CO-OP
                </span>
              </div>
            </section>
            <section className="missions">
              <div className="sectionTop">
                <div>
                  <span className="kicker">
                    <Flag size={15} /> THE CAMPAIGN
                  </span>
                  <h2>
                    Mission lineup<span>.</span>
                  </h2>
                </div>
                <span className="count">6 MISSIONS</span>
              </div>
              <div className="grid">
                {missions.map((m, i) => (
                  <article key={m[0]}>
                    <div className="postcard">
                      <img src={"/art/m" + (i + 1) + ".svg"} alt="" />
                      <span>MISSION 0{i + 1}</span>
                    </div>
                    <div className="cardbody">
                      <small>{m[2]}</small>
                      <h3>{m[0]}</h3>
                      <p>{m[1].split(". ")[0]}.</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            {how}
          </>
        ) : !v ? (
          <section className="panel">
            <span className="kicker">
              <Gamepad2 size={17} /> PLAYER SETUP
            </span>
            <h1>
              Meet your bestie<span>.</span>
            </h1>
            <div className="setup">
              <div className="preview">
                <Avatar p={profile} />
                <h3>{profile.name || "Your bestie"}</h3>
              </div>
              <div>
                <label>
                  Nickname
                  <input
                    maxLength={18}
                    value={profile.name}
                    placeholder="Your nickname"
                    onChange={(e) => P({ ...profile, name: e.target.value })}
                  />
                </label>
                <label>Character</label>
                <div className="buttons">
                  {["Bunny", "Sprout"].map((s) => (
                    <button
                      aria-pressed={profile.shape === s}
                      key={s}
                      onClick={() => P({ ...profile, shape: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <label>Color & avatar</label>
                <div className="buttons">
                  {colors.map((c) => (
                    <button
                      className="swatch"
                      aria-label={"Choose color " + c}
                      style={{ background: c }}
                      key={c}
                      onClick={() => P({ ...profile, color: c })}
                    >
                      {profile.color === c ? "✓" : ""}
                    </button>
                  ))}
                  {["★", "♥", "✿", "☻"].map((a) => (
                    <button
                      key={a}
                      aria-pressed={profile.avatar === a}
                      onClick={() => P({ ...profile, avatar: a })}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="roomform">
              <button
                className="primary"
                disabled={!online}
                onClick={() => enter(false)}
              >
                <LockKeyhole size={18} /> Create private room
              </button>
              <span>or</span>
              <input
                aria-label="Room code"
                placeholder="Room code"
                value={code}
                maxLength={6}
                onChange={(e) => C(e.target.value.toUpperCase())}
              />
              <button disabled={!online} onClick={() => enter(true)}>
                Join room
              </button>
            </div>
            <p role="status">
              {error ||
                (!online ? "Connecting to arcade…" : "Server connected")}
            </p>
          </section>
        ) : (
          <>
            <div className="roomtop">
              <span className="kicker">
                <Radio size={17} /> PRIVATE ROOM · {v.code}
              </span>
              <button onClick={leave}>
                <LogOut size={16} /> Leave room
              </button>
            </div>
            {v.phase === "lobby" ? (
              <section className="panel">
                <span className="label">TWO-PLAYER CO-OP</span>
                <h1>
                  Ready room<span>.</span>
                </h1>
                <p>Share this code with your friend to team up.</p>
                <button
                  className="invite"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(v.code);
                      Cp(true);
                      setTimeout(() => Cp(false), 1600);
                    } catch {
                      E("Select and copy the room code.");
                    }
                  }}
                >
                  {v.code} {copied ? <Check /> : <Copy />}
                </button>
                <div className="slots">
                  {[0, 1].map((i) => {
                    const p = v.players[i];
                    return (
                      <div key={i}>
                        {p ? (
                          <>
                            <Avatar p={p} />
                            <h3>{p.name}</h3>
                            <p>
                              {p.id === v.host ? "Host" : "Guest"} ·{" "}
                              {p.online
                                ? p.ready
                                  ? "Ready"
                                  : "Getting ready"
                                : "Disconnected"}
                            </p>
                          </>
                        ) : (
                          <>
                            <Users size={40} />
                            <h3>Waiting for friend</h3>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="buttons">
                  <button onClick={() => command("ready")}>
                    {v.players[idx]?.ready ? "Cancel ready" : "Ready up"}
                  </button>
                  {isHost && (
                    <button
                      className="primary"
                      disabled={
                        v.players.length !== 2 ||
                        !v.players.every((p) => p.online && p.ready)
                      }
                      onClick={() => command("start")}
                    >
                      <Play size={17} />
                      Start game
                    </button>
                  )}
                </div>
              </section>
            ) : v.phase === "game" ? (
              <section className="panel play">
                <div className="sectionTop">
                  <div>
                    <span className="kicker">
                      MISSION 0{v.mission + 1} / 06
                    </span>
                    <h2>{missions[v.mission][0]}</h2>
                  </div>
                  <b className="clock">{Math.ceil(v.time)}s</b>
                </div>
                <p>{missions[v.mission][1]}</p>
                <div className="gamehud">
                  {v.players.map((p) => (
                    <span key={p.id}>
                      {p.online ? "●" : "○"} {p.name}
                    </span>
                  ))}
                  {isHost && (
                    <button onClick={() => command("pause")}>
                      <Pause size={14} />
                      {v.paused ? "Resume" : "Pause"}
                    </button>
                  )}
                </div>
                <Arena
                  v={v}
                  id={id}
                  send={send}
                  act={() => act(-1)}
                  pause={() => {
                    if (isHost) command("pause");
                  }}
                  sfx={beep}
                  emote={
                    msg
                      ? v.players.find((p) => p.id === msg.split("|")[0])
                          ?.name +
                        ": " +
                        msg.split("|")[1]
                      : ""
                  }
                />
                {(!online || v.paused || v.players.some((p) => !p.online)) && (
                  <p role="alert">
                    {v.paused ? "Game paused" : "Waiting for reconnection…"}
                  </p>
                )}
                {[0, 1, 4].includes(v.mission) ? (
                  <>
                    <div className="buttons touch">
                      {[-1, 1].map((n) => (
                        <button
                          key={n}
                          onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            touchDirection.current = n;
                            send({ move: n, jump: false });
                          }}
                          onPointerUp={() => {
                            touchDirection.current = 0;
                            send({ move: 0, jump: false });
                          }}
                          onPointerCancel={() => {
                            touchDirection.current = 0;
                            send({ move: 0, jump: false });
                          }}
                        >
                          {n < 0 ? "Left" : "Right"}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          send({ move: touchDirection.current, jump: true });
                          beep(410);
                        }}
                      >
                        Jump
                      </button>
                      {v.mission !== 1 && (
                        <button onClick={() => act(-1)}>Interact</button>
                      )}
                    </div>
                    <small>
                      A / D or arrows to move · W / Space to jump · E to
                      interact · Esc to pause
                    </small>
                    {v.mission === 4 && (
                      <p>
                        {idx === v.runner
                          ? "You are crossing."
                          : "You control the bridge. Press E to toggle it."}
                      </p>
                    )}
                  </>
                ) : v.mission === 2 ? (
                  <>
                    <h3>
                      {idx === 0
                        ? "Guide your friend along the gold path"
                        : "Follow your scout’s directions"}
                    </h3>
                    {idx === 1 && (
                      <div className="buttons">
                        {directions.map((s, i) => (
                          <button key={s} onClick={() => act(i)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : v.mission === 3 ? (
                  <>
                    <h3>
                      {idx === 0
                        ? "Read the secret code"
                        : "Enter your friend’s code"}{" "}
                      · {v.progress} entered
                    </h3>
                    <div className="buttons">
                      {idx === 0
                        ? v.sequence.map((n, i) => <b key={i}>{fruit[n]}</b>)
                        : fruit.map((s, i) => (
                            <button key={s} onClick={() => act(i)}>
                              {s}
                            </button>
                          ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>
                      Order · {v.recipe.map((n) => toppings[n]).join(" + ")}
                    </h3>
                    <p>
                      {idx === 0
                        ? "Pick ingredients for the chef"
                        : "Add ingredients to the pizza"}{" "}
                      · Served {v.progress}
                    </p>
                    <div className="buttons">
                      {toppings.map((s, i) => (
                        <button key={s} onClick={() => act(i)}>
                          {s} ({v.stock[i]})
                        </button>
                      ))}
                      {idx === 1 && (
                        <button onClick={() => act(4)}>Serve pizza</button>
                      )}
                    </div>
                    <p>
                      Pizza ·{" "}
                      {v.tray.map((n) => toppings[n]).join(", ") || "Empty"}
                    </p>
                  </>
                )}
                <div className="chat">
                  <label>
                    Quick chat{" "}
                    <select
                      value=""
                      onChange={(e) =>
                        sock.current?.emit("chat", e.target.value)
                      }
                    >
                      <option value="">Send a message…</option>
                      {chats.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  {["😂", "😭", "🎉", "🤦", "😡", "💃", "🤔"].map((s) => (
                    <button
                      key={s}
                      onClick={() => sock.current?.emit("chat", s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="panel result">
                <span className="kicker">
                  {v.mission === 5 ? "CAMPAIGN RESULTS" : "MISSION RESULTS"}
                </span>
                <div className="stars">
                  {[0, 1, 2].map((n) => (
                    <Star
                      key={n}
                      fill={n < v.history.at(-1)!.stars ? "#ffd260" : "none"}
                    />
                  ))}
                </div>
                <h1>
                  {v.history.at(-1)?.title}
                  <span>!</span>
                </h1>
                <p>
                  {v.history.at(-1)?.win ? "Mission complete" : "Time ran out"}{" "}
                  · {missions[v.mission][0]}
                </p>
                <div className="celebrate">
                  {v.players.map((p) => (
                    <Avatar key={p.id} p={p} />
                  ))}
                </div>
                <div className="stats">
                  {Object.entries({
                    Seconds: v.history.at(-1)?.seconds,
                    Mistakes: v.mistakes,
                    Teamwork: v.history.at(-1)?.score,
                  }).map(([k, n]) => (
                    <div key={k}>
                      <strong>{n}</strong>
                      {k}
                    </div>
                  ))}
                </div>
                {v.mission === 5 && (
                  <p>
                    Team total · {v.history.reduce((a, r) => a + r.stars, 0)} /
                    18 stars · {v.history.reduce((a, r) => a + r.seconds, 0)}{" "}
                    seconds
                  </p>
                )}
                {isHost ? (
                  <div className="buttons">
                    <button onClick={() => command("again")}>Play again</button>
                    {v.mission < 5 && v.history.at(-1)?.win && (
                      <button
                        className="primary"
                        onClick={() => command("next")}
                      >
                        Next mission <ChevronRight size={16} />
                      </button>
                    )}
                    <button onClick={() => command("lobby")}>
                      Return to lobby
                    </button>
                  </div>
                ) : (
                  <p>Waiting for the host to choose the next mission.</p>
                )}
              </section>
            )}
            {error && <p>{error}</p>}
            {!online && <p>Reconnecting to your room…</p>}
          </>
        )}
      </main>
      <footer className="wrap">
        <Gamepad2 size={20} /> Bestie Breakout{" "}
        <span>Two brains. One mission.</span>
      </footer>
    </>
  );
}
