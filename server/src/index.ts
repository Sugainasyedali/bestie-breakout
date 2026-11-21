import {verifyTicket} from "../../shared/tickets.js";
import {pool,unlocked} from "../../shared/database.js";
import {catalog} from "../../shared/catalog.js";
import {saveQueue} from "./saves.js";
import express from "express";
import { createServer } from "node:http";
import {randomUUID,createHash, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { Server } from "socket.io";
import {
  chats,
  type Ack,
  type ClientEvents,
  type Input,
  type Profile,
  type ServerEvents,
  type View,
} from "../../shared/model.js";
import { action, start, tick } from "./game.js";
type Room = {
  v: View;
  session:string; attempt:string; recorded:number; started:string; campaignStart:string; originalHost:string|null;
  slots: {
    id: string;
    token: string;
    user:string|null; max:number;
    socket: string;
    loaded: number;
    last: number;
    input: Input;
  }[];
};
function personalBoard(v:View,i:number){if(!v.board||!v.level)return;const b=v.board,s=catalog[v.level-1].challenge!.stages[b.stage],runner=s.role??1;
 const reader=s.mode==='rhythm'?b.step%2:1-runner,w=b.tiles[0].length;
 return {...b,code:i===reader?b.code:[],tiles:s.mode==='route'&&i===runner?b.tiles.map((row,y)=>[...row].map((c,x)=> Math.abs(x-b.actors[i]%w)+Math.abs(y-Math.floor(b.actors[i]/w))<=1?c:'?').join('')):b.tiles}}
export function makeServer() {
  const app = express(),
    http = createServer(app),
    io = new Server<ClientEvents, ServerEvents>(http, {
      cors: { origin: process.env.CLIENT_ORIGIN?.split(",") || true },
      maxHttpBufferSize: 4096,
    });
  app.get("/health", (_, res) => res.json({ ok: true }));
  const rooms = new Map<string, Room>();
  const queue=saveQueue((attempt)=>{for(const r of rooms.values())if(r.attempt===attempt){r.v.saveStatus='saved';emit(r)}});
  function record(r:Room,abandoned=false){const v=r.v;if(!v.round||r.recorded===v.round||(!abandoned&&v.phase!=="results"))return;
   r.recorded=v.round;const h=abandoned?undefined:v.history.at(-1),level=v.level??1;
   if(h?.win)r.slots.forEach(s=>s.max=Math.max(s.max,Math.min(36,level+1)));
   if(!r.slots.some(s=>s.user)&&!process.env.DATABASE_URL_POOLED){v.saveStatus='guest';return}
   v.saveStatus=r.slots.some(s=>s.user)?'pending':'guest';
   queue.add({id:r.attempt,session:r.session,round:v.round,level,hash:createHash('sha256').update(r.session+r.v.code).digest('hex'),host:r.originalHost,start:r.campaignStart,end:new Date().toISOString(),outcome:abandoned?'abandoned':h?.win?'win':'loss',score:h?.score??0,stars:h?.stars??0,mistakes:v.mistakes,seconds:h?.seconds??Math.round(catalog[level-1].limit-v.time),players:r.slots.map((s,i)=>({user:s.user,guest:s.id,role:i,character:v.players[i].shape}))})}
  function begin(r:Room,level:number){r.started=new Date().toISOString();r.attempt=randomUUID();start(r.v,Math.floor((level-1)/6),level)}
  io.use(async(socket,next)=>{const ticket=socket.handshake.auth?.ticket;if(!ticket)return next();try{const p=verifyTicket(ticket);
   const result=await pool().query("insert into bestie.consumed_tickets(jti,expires_at) select $1,to_timestamp($2::double precision/1000) from bestie.player_profiles where id=$3 and auth_user_id=$4 on conflict do nothing returning jti",[p.jti,p.exp,p.profile,p.sub]);if(!result.rowCount)throw Error();
   socket.data.user=p.profile;socket.data.max=await unlocked(p.profile);socket.data.cosmetic=(await pool().query('select cosmetic_id from bestie.player_inventory where user_id=$1 and is_equipped limit 1',[p.profile])).rows[0]?.cosmetic_id;
   await pool().query('delete from bestie.consumed_tickets where expires_at<now()');next()}catch{next(Error('Account session could not be verified. Sign in again or retry.'))}});
  function emit(r: Room) {
    record(r);
    r.v.maxLevel=Math.min(36,...r.slots.map(s=>s.max));
    r.slots.forEach((s, i) => {
      if (s.socket)
        io.to(s.socket).emit("state", {
          ...r.v,
          board:personalBoard(r.v,i),
          sequence: i === 0 ? r.v.sequence : [],
          maze: i === 0 ? r.v.maze : [],
        });
    });
  }
  function remove(r: Room, i: number) {
    if(r.v.phase==="game")record(r,true);
    r.slots.splice(i, 1);
    r.v.players.splice(i, 1);
    if (!r.slots.length) {
      rooms.delete(r.v.code);
      return;
    }
    r.v.host = r.slots[0].id;
    r.v.phase = "lobby";
    r.v.players.forEach((p) => (p.ready = false));
    emit(r);
  }
  io.on("connection", (socket) => {
    let room: Room | undefined,
      id = "",
      lastChat = 0,
      lastAction = 0,
      events = 0,
      windowStart = Date.now();
    socket.use((_, next) => {
      if (Date.now() - windowStart > 1000) {
        events = 0;
        windowStart = Date.now();
      }
      if (++events <= 110) next();
    });
    function enter(r: Room, p: Profile, ack: Ack) {
      if (!p || typeof p.name !== "string" || !p.name.trim())
        return ack({ error: "Enter a nickname first." });
      id = randomBytes(8).toString("hex");
      room = r;
      const token = randomBytes(24).toString("hex");
      r.slots.push({
        id,
        token,user:socket.data.user??null,max:socket.data.max??1,
        socket: socket.id,
        loaded: -1,
        last: 0,
        input: { move: 0, jump: false },
      });
      r.v.players.push({
        id,
        cosmetic:socket.data.cosmetic,
        name: p.name.trim().slice(0, 18),
        color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#ff9db4",
        shape: p.shape === "Sprout" ? "Sprout" : "Bunny",
        avatar: ["✿", "★", "♥", "☻"].includes(p.avatar) ? p.avatar : "★",
        online: true,
        ready: false,
        x: 80,
        y: 278,
        vy: 0,
        gestures: 0,
        ground: true,
        dir: 1,
      });
      if (!r.v.host) r.v.host = id;
      rooms.set(r.v.code, r);
      ack({ id, token, code: r.v.code });
      emit(r);
    }
    socket.on("create", (p, ack) => {
      if (typeof ack !== "function") return;
      if (room) return ack({ error: "Leave your current room first." });
      let code = "";
      do {
        code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
      } while (rooms.has(code));
      enter(
        {
          session:randomUUID(),attempt:"",recorded:-1,started:"",campaignStart:"",originalHost:null,slots: [],
          v: {
            code,
            host: "",
            players: [],
            phase: "lobby",
            mission: 0,
            round: 0,
            intro: 0,
            outro: 0,
            time: 0,
            progress: 0,
            mistakes: 0,
            correct: 0,
            keyTaken: false,
            gate: false,
            relay: false,
            box: 160,
            bridge: false,
            runner: 1,
            recipe: [],
            tray: [],
            stock: [],
            sequence: [],
            maze: [],
            cell: 0,
            paused: false,
            history: [],
          },
        },
        p,
        ack,
      );
    });
    socket.on("join", (d, ack) => {
      if (typeof ack !== "function") return;
      const r = rooms.get(String(d?.code).toUpperCase());
      if (room || !r || r.slots.length >= 2 || (socket.data.user && r.slots.some(s=>s.user===socket.data.user)))
        return ack({
          error: room
            ? "Already in a room."
            : !r
              ? "Room code is invalid or expired."
              : "This room is full.",
        });
      enter(r, d.profile, ack);
    });
    socket.on("restore", (d, ack) => {
      if (typeof ack !== "function") return;
      const r = rooms.get(d?.code),
        s = r?.slots.find((s) => s.token === d.token);
      if (room || !r || !s || s.socket || s.user!==(socket.data.user??null))
        return ack({ error: "This seat is unavailable." });
      room = r;
      id = s.id;
      s.socket = socket.id;
      r.v.players[r.slots.indexOf(s)].online = true;
      ack({ id, token: s.token, code: r.v.code });
      emit(r);
    });
    socket.on("command", (cmd) => {
      if (!room) return;
      const r = room,
        v = r.v,
        i = r.slots.findIndex((s) => s.id === id);
      if (cmd === "leave") {
        room = undefined;
        remove(r, i);
        return;
      }
      if (cmd === "ready" && v.phase === "lobby")
        v.players[i].ready = !v.players[i].ready;
      else if (id === v.host) {
        if(typeof cmd==="string"&&cmd.startsWith("level:")&&v.phase==="lobby"){const n=Number(cmd.slice(6));if(Number.isInteger(n)&&n>=1&&n<=Math.min(...r.slots.map(s=>s.max))){v.level=n;v.players.forEach(p=>p.ready=false)}else socket.emit("notice","Both friends must unlock this level.");}
        else if (cmd === "lobby") {
          if(v.phase==="game")record(r,true);
          v.phase = "lobby";
          v.players.forEach((p) => (p.ready = false));
        } else if (v.players.length === 2 && v.players.every((p) => p.online)) {
          if (
            cmd === "start" &&
            v.phase === "lobby" &&
            v.players.every((p) => p.ready)
          ) {
            r.slots.forEach((s) => (s.input = { move: 0, jump: false }));
            v.history = [];
            r.session=randomUUID();r.campaignStart=new Date().toISOString();r.originalHost=r.slots[i].user;begin(r,Math.min(v.level??1,...r.slots.map(s=>s.max)));
          } else if (
            v.phase === "results" &&
            !v.outro &&
            (cmd === "again" ||
              (cmd === "next" && (v.level??1)<Math.min(36,...r.slots.map(s=>s.max)) && v.history.at(-1)?.win))
          ) {
            r.slots.forEach((s) => (s.input = { move: 0, jump: false }));
            if (cmd === "again") v.history.pop();
            begin(r,(v.level??1)+(cmd==="next"?1:0));
          } else if (cmd === "pause" && v.phase === "game") {
            v.paused = !v.paused;
            r.slots.forEach((s) => (s.input = { move: 0, jump: false }));
          }
        }
      }
      emit(r);
    });
    socket.on("loaded", (round) => {
      const seat = room?.slots.find((s) => s.id === id);
      if (seat && room?.v.phase === "game" && room.v.round === round)
        seat.loaded = round;
    });
    socket.on("input", (p) => {
      const s = room?.slots.find((s) => s.id === id);
      if (
        s &&
        room?.v.phase === "game" &&
        !room.v.intro &&
        !room.v.paused &&
        p &&
        [-1, 0, 1].includes(p.move)
      ) {
        s.input.move = p.move;
        s.input.jump ||= p.jump === true;
      }
    });
    socket.on("action", (n) => {
      if (
        room &&
        !room.v.intro &&
        Date.now() - lastAction > 100 &&
        room.v.players.every((p) => p.online)
      ) {
        if (
          room.v.phase !== "game" ||
          room.v.paused ||
          !Number.isInteger(n) ||
          n < -1 ||
          n > 4
        )
          return;
        lastAction = Date.now();
        const actor = room.v.players.find((p) => p.id === id);
        if (actor) actor.gestures++;
        action(
          room.v,
          room.slots.findIndex((s) => s.id === id),
          n,
        );
        emit(room);
      }
    });
    socket.on("chat", (s) => {
      if (
        room &&
        Date.now() - lastChat > 250 &&
        [...chats, "😂", "😭", "🎉", "🤦", "😡", "💃", "🤔"].includes(s)
      ) {
        lastChat = Date.now();
        room.slots.forEach((p) =>
          io.to(p.socket).emit("message", { id, text: s }),
        );
      }
    });
    socket.on("disconnect", () => {
      if (!room) return;
      const r = room,
        i = r.slots.findIndex((s) => s.id === id);
      if (i < 0) return;
      Object.assign(r.slots[i], {
        socket: "",
        loaded: -1,
        last: Date.now(),
        input: { move: 0, jump: false },
      });
      r.v.players[i].online = false;
      if (r.v.host === id)
        r.v.host = r.v.players.find((p) => p.online)?.id || id;
      emit(r);
    });
  });
  let frame = 0;
  const timer = setInterval(() => {
    frame++;
    for (const r of rooms.values()) {
      for (let i = r.slots.length - 1; i >= 0; i--)
        if (!r.slots[i].socket && Date.now() - r.slots[i].last > 120000)
          remove(r, i);
      if (r.v.phase === "game") {
        if (r.v.intro > 0) {
          if (
            !r.v.paused &&
            r.slots.every((s) => s.socket && s.loaded === r.v.round)
          )
            r.v.intro = Math.max(0, r.v.intro - 0.025);
        } else
          tick(
            r.v,
            r.slots.map((s) => s.input),
            1 / 40,
          );
        if (frame % 3 === 0 || r.v.phase !== "game") emit(r);
      } else if (r.v.phase === "results" && r.v.outro > 0) {
        r.v.outro = Math.max(0, r.v.outro - 0.025);
        if (r.v.outro === 0) emit(r);
      }
    }
  }, 25);
  return {
    http,
    close: () => {
      queue.close();clearInterval(timer);
      io.close();
    },
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  makeServer().http.listen(Number(process.env.PORT) || 4000, "0.0.0.0");
