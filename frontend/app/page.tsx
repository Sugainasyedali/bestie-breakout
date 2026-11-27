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
import { AdventureScreen } from "../game3d/ui/adventure-screen";
import { MissionScreen } from "./mission-screen";
import { arcadeAudio } from "./sound";
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
  const previous = useRef<View | null>(null),
    sock = useRef<Socket<ServerEvents, ClientEvents> | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(()=>{const update=(e:Event)=>U((e as CustomEvent).detail.sound_enabled);window.addEventListener('bestie-preferences',update);return()=>window.removeEventListener('bestie-preferences',update)},[]);
  function toggle() {
    arcadeAudio.unlock();
    arcadeAudio.setEffects(!sound);
    U(!sound);
    arcadeAudio.cue("click");
  }
  useEffect(() => {
    const saved = localStorage.getItem("bestie-profile");
    if (saved)
      try {
        P(JSON.parse(saved));
      } catch {}
    if (sessionStorage.getItem("bestie-seat")||location.search) S("setup");
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
        if (next.mistakes > old.mistakes) arcadeAudio.cue("fail");
        else if (next.keyTaken && !old.keyTaken) arcadeAudio.cue("collect");
        else if (next.gate && !old.gate) arcadeAudio.cue("door");
        else if (next.correct > old.correct) arcadeAudio.cue("correct");
      }
      if (old?.intro && !next.intro && next.phase === "game")
        arcadeAudio.cue("start");
      if (old?.phase === "game" && next.phase === "results")
        arcadeAudio.cue(
          next.history.at(-1)?.win
            ? next.mission === 5
              ? "victory"
              : "complete"
            : "fail",
        );
      previous.current = next;
      V(next);
      const desired=Number(new URLSearchParams(location.search).get('level'));if(next.phase==='lobby'&&next.host===sessionStorage.getItem('bestie-id')&&desired&&next.level!==desired){s.emit('command','level:'+desired);history.replaceState(null,'','/')}

    });
    s.on("message", (m) => {
      M(m.id + "|" + m.text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => M(""), 3200);
      arcadeAudio.cue("emote");
    });
    let cancelled=false;
    async function connect(){try{const session=await fetch('/api/player/session');const info=await session.json();if(info.signedIn){const r=await fetch('/api/player/ticket',{method:'POST'});const b=await r.json();if(!r.ok)throw Error(b.error);s.auth={ticket:b.ticket}}if(!cancelled)s.connect()}catch(err){E(String(err))}}
    void connect();
    return () => {
      cancelled=true;clearTimeout(timer.current);
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
      I(r.id!);sessionStorage.setItem("bestie-id",r.id!);
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
      arcadeAudio.cue("switch");
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
  if(v?.adventure&&v.phase!=="lobby")return <AdventureScreen v={v} id={id} online={online} msg={msg} command={command} send={p=>sock.current?.emit("input3d",p)} interact={drop=>sock.current?.emit("interact3d",{round:v.round,drop})} loaded={round=>sock.current?.emit("loaded",round)} chat={m=>sock.current?.emit("chat",m)} leave={leave} effects={sound} toggleEffects={toggle}/>;
  if (v && v.phase !== "lobby")
    return (
      <MissionScreen
        v={v}
        id={id}
        online={online}
        msg={msg}
        command={command}
        send={send}
        act={act}
        chat={(m) => sock.current?.emit("chat", m)}
        loaded={(round) => sock.current?.emit("loaded", round)}
        leave={leave}
        effects={sound}
        toggleEffects={toggle}
      />
    );
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
          <div className="navright"><a href="/map">Adventure</a><a href="/account">Account</a>
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
                <label>Campaign level<select value={v.level??1} disabled={!isHost} onChange={e=>command('level:'+e.target.value)}>{Array.from({length:v.maxLevel??1},(_,i)=><option key={i} value={i+1}>Level {i+1}</option>)}</select></label>
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
                <p><strong>New: Pinewood 3D adventure</strong> · Explore the village, find two keys, and escape together. First-level preview with original provisional characters.</p>
                <div className="buttons">
                  {isHost&&<button className="primary" disabled={v.players.length!==2||!v.players.every(p=>p.online&&p.ready)} onClick={()=>command("start3d")}>Play 3D village</button>}
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
                      Play classic campaign
                    </button>
                  )}
                </div>
              </section>
            ) : null}
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
