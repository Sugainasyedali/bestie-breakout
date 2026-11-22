"use client";
import {catalog} from "../../shared/catalog";
import {drawChallenge} from "./challenge-board";

import { useEffect, useRef } from "react";
import {
  bridgeCenter,
  fruit,
  toppings,
  type View,
  type Input,
} from "../../shared/model";
import { scenery } from "./scenery";
import { drawPuppet, type Pose } from "./puppet";
import { arcadeAudio } from "./sound";
type Props = {
  v: View;
  id: string;
  send: (p: Input) => void;
  act: (n?:number) => void;
  pause: () => void;
  emote: string;
  ready: () => void;
};
const trims = [0xa8dfb0, 0xedaf5f, 0x7ed4aa, 0xc39cff, 0x99e6ce, 0xffb588];
const soils = [0x837599, 0x886759, 0x596d73, 0x51456e, 0x8f839a, 0xc3836f];
const ink = 0x343046;
const emotes: Record<string, Pose> = {
  "😂": "laugh",
  "😭": "cry",
  "🎉": "celebrate",
  "🤦": "facepalm",
  "😡": "hit",
  "💃": "celebrate",
  "🤔": "confused",
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
};
export function Arena(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    let dead = false,
      game: import("phaser").Game | undefined;
    import("phaser").then(({ default: P }) => {
      if (dead || !host.current) return;
      class Stage extends P.Scene {
        g!: Phaser.GameObjects.Graphics;
        sky!: Phaser.GameObjects.Image;
        words: Phaser.GameObjects.Text[] = [];
        index = 0;
        keys!: Record<string, Phaser.Input.Keyboard.Key>;
        lastMove = 0;
        previous: View | null = null;
        door = 150;
        clock = 0;
        feedback = "";
        feedbackUntil = 0;
        reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        actors = [0, 1].map(() => ({
          x: 0,
          y: 0,
          ground: true,
          land: 0,
          anticipate: 0,
          step: 0,
          gesture: 0,
          speed: 0,
        }));
        impact = 0;
        reach = 0;
        particles: Particle[] = [];
        lastFull = 0;
        cameraOffset = 0;

        preload() {
          this.load.svg(
            "world",
            "/art/worlds/" + latest.current.v.mission + ".svg",
            { width: 1600, height: 900 },
          );
        }
        create() {
          this.sky = this.add.image(400, 100, "world");
          this.g = this.add.graphics();
          this.keys = this.input.keyboard!.addKeys(
            "A,D,W,S,UP,DOWN,LEFT,RIGHT,SPACE,E,ESC,ONE,TWO,THREE,FOUR",
            false,
          ) as typeof this.keys;
          try{const prefs=JSON.parse(sessionStorage.getItem('bestie-preferences')||'{}');this.reduced=this.reduced||prefs.reduced_motion===true}catch{}
          const preferences=(e:Event)=>{this.reduced=(e as CustomEvent).detail.reduced_motion||matchMedia('(prefers-reduced-motion: reduce)').matches};
          window.addEventListener('bestie-preferences',preferences);this.events.once('shutdown',()=>window.removeEventListener('bestie-preferences',preferences));
          const stop = () => {
            latest.current.send({ move: 0, jump: false });
            this.lastMove = 0;
          };
          const fullscreen = () => {
            this.lastFull = performance.now();
          };
          window.addEventListener("blur", stop);
          document.addEventListener("fullscreenchange", fullscreen);
          this.events.once("shutdown", () => {
            window.removeEventListener("blur", stop);
            document.removeEventListener("fullscreenchange", fullscreen);
          });
          latest.current.ready();
        }
        word(x: number, y: number, s: string, size = 12, color = "#fff7df") {
          let label = this.words[this.index];
          if (!label) {
            label = this.add
              .text(0, 0, "", {
                fontFamily: "system-ui",
                fontStyle: "bold",
                stroke: "#39334a",
                strokeThickness: 3,
                resolution: 2,
              })
              .setOrigin(0.5);
            this.words.push(label);
          }
          this.index++;
          label.setPosition(x, y).setVisible(true);
          if (label.text !== s) label.setText(s);
          if (label.style.fontSize !== size + "px") label.setFontSize(size);
          if (label.style.color !== color) label.setColor(color);
        }
        burst(x: number, y: number, color: number, count = 10) {
          if (this.reduced) return;
          for (let i = 0; i < count && this.particles.length < 64; i++)
            this.particles.push({
              x,
              y,
              vx: Math.cos(i * 2.4) * 55,
              vy: -35 - ((i * 23) % 80),
              life: 0.8,
              color,
            });
        }
        update(t: number, delta: number) {
          const { v, id, send, act, pause, emote } = latest.current,
            g = this.g;
          if (!g) return;
          const m = v.mission,
            dt = Math.min(delta, 50) / 1000,
            won = v.phase === "results" && v.history.at(-1)?.win,
            res = v.phase === "results",
            live =
              !res && !v.paused && !v.intro && v.players.every((p) => p.online);
          if (!v.paused) this.clock += dt;
          const clock = this.reduced ? 0 : this.clock,
            old = this.previous;
          this.index = 0;
          g.clear();
          const w = this.scale.width,
            h = this.scale.height,
            follow = w < 600 && w < h && !res && [0, 1, 4].includes(m),
            z = Math.min(w / (follow ? 500 : 844), h / (w < 600 ? 620 : 545));
          const camera = this.cameras.main;
          camera.setZoom(z);
          const centerY = 140 + (w < h ? 35 : 0);
          const mid =
            v.players.reduce((sum, p) => sum + p.x, 0) /
            Math.max(1, v.players.length);
          const ownX = v.players.find((p) => p.id === id)?.x ?? mid;
          const desired = follow
            ? Math.max(-166, Math.min(166, ownX - 400))
            : this.reduced || res
              ? 0
              : (mid - 400) * 0.034;
          this.cameraOffset +=
            (desired - this.cameraOffset) *
            (this.reduced ? 1 : 1 - Math.exp(-dt * 5));
          camera.centerOn(400 + this.cameraOffset, centerY);
          const worldW = w / z,
            worldH = h / z,
            left = 400 + this.cameraOffset - worldW / 2,
            top = centerY - worldH / 2;
          const parallax = this.reduced
            ? 0
            : (mid - 400) * 0.022 + this.cameraOffset * 0.12;
          const cover =
            Math.max((worldW + Math.abs(parallax) * 2) / 1600, worldH / 900) *
            1.05;
          this.sky
            .setPosition(400 + this.cameraOffset - parallax, centerY)
            .setScale(cover);
          const move =
            Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
            Number(this.keys.A.isDown || this.keys.LEFT.isDown);
          const jump =
            (!v.board && P.Input.Keyboard.JustDown(this.keys.W)) ||
            P.Input.Keyboard.JustDown(this.keys.SPACE);
          const typing = ["INPUT", "SELECT", "TEXTAREA"].includes(
            document.activeElement?.tagName || "",
          );
          if (!live) this.lastMove = 0;
          if(live&&!typing&&v.board){
            const bindings=[["UP","W"],["RIGHT","D"],["DOWN","S"],["LEFT","A"]];
            bindings.forEach((names,n)=>{if(names.some(name=>P.Input.Keyboard.JustDown(this.keys[name])))act(n)});
            ["ONE","TWO","THREE","FOUR"].forEach((name,n)=>{if(P.Input.Keyboard.JustDown(this.keys[name]))act(n)});
            if(jump)act(4);
          }
          if (live && !typing && !v.board && (move !== this.lastMove || jump)) {
            send({ move, jump });
            this.lastMove = move;
            if (jump) {
              const own = this.actors[v.players.findIndex((p) => p.id === id)];
              if (own) own.anticipate = t + 65;
              arcadeAudio.cue("jump");
            }
          }
          if (live && !typing && P.Input.Keyboard.JustDown(this.keys.E)) {
            act(v.board?4:undefined);
            this.reach = t + 340;
          }
          if (
            P.Input.Keyboard.JustDown(this.keys.ESC) &&
            performance.now() - this.lastFull > 350
          )
            pause();
          const box = (
            x: number,
            y: number,
            w: number,
            h: number,
            c: number,
            r = 4,
          ) => {
            if (h <= 0) return;
            g.fillStyle(c).fillRoundedRect(x, y, w, h, r);
            g.lineStyle(1.8, ink).strokeRoundedRect(x, y, w, h, r);
          };
          // Animated atmospheric layer sits between the painted distance and playable terrain.
          for (let i = 0; i < 26; i++) {
            const x =
              left +
              ((i * 89 + clock * (m === 2 ? 4 : 9)) % worldW) -
              parallax * 2;
            const y =
              top +
              ((i * 57 + clock * (m === 5 ? -7 : 2) + worldH * 100) % worldH) +
              Math.sin(i + clock) * 5;
            g.fillStyle(
              m === 2 ? 0xffda76 : m === 3 ? 0xef9ffc : 0xffefd1,
              m === 5 ? 0.15 : 0.55,
            ).fillEllipse(x, y, m === 5 ? 15 : 3, m === 5 ? 22 : 2);
          }
          scenery(g, v, clock, parallax);
          const land = (x: number, width: number) => {
            const depth = m === 4 ? 46 : Math.max(65, top + worldH - 278);
            box(x, 278, width, depth, soils[m], 8);
            box(x, 276, width, 12, trims[m]);
            for (let xx = x + 8; xx < x + width - 10; xx += 23) {
              g.fillStyle(0xffffff, 0.28).fillRoundedRect(xx, 279, 12, 2, 1);
              g.fillStyle(ink, 0.16).fillEllipse(xx + 7, 298, 8, 4);
            }
          };
          if(v.board&&v.level){drawChallenge(g,v.board,catalog[v.level-1].challenge!.stages[v.board.stage],m,this.word.bind(this),clock)}else {
          if (m === 4) {
            land(-12, 272);
            land(540, 272);
            if (v.bridge) {
              box(bridgeCenter(v.time) - 75, 277, 150, 12, 0xffcf7a);
              for (let i = -52; i < 70; i += 22)
                g.fillStyle(0xfff1b7).fillCircle(
                  bridgeCenter(v.time) + i,
                  282,
                  2,
                );
            }
          } else land(left - 8, worldW + 16);
          if (m === 0) {
            box(188, 270, 64, 8, 0x55537a);
            g.fillStyle(v.gate ? 0x77ffbb : 0xff9daa, 0.25).fillEllipse(
              220,
              271,
              79,
              19,
            );
            box(
              198,
              v.gate ? 269 : 265,
              44,
              v.gate ? 5 : 9,
              v.gate ? 0x8efab8 : 0xff779e,
            );
            box(314, 236, 32, 42, 0xb798bb);
            box(309, 233, 42, 8, 0xe4c7ce);
            this.door +=
              ((v.gate ? 0 : 150) - this.door) * (1 - Math.exp(-dt * 11));
            box(461, 125, 29, this.door, 0x81749e);
            for (let i = 10; i < this.door - 3; i += 16)
              g.fillStyle(0xd6bbd0).fillRect(462, 125 + i, 26, 3);
            box(455, 116, 41, 15, 0xf3c780);
            box(565, 249, 12, 29, 0x8f7b98);
            g.fillStyle(v.relay ? 0x83f3b0 : 0xffc06d).fillCircle(571, 248, 7);
            this.word(572, 228, "RELAY", 9);
            this.word(749, 249, "⚑ EXIT");
            if (!v.keyTaken)
              this.word(665, 219 + Math.sin(clock * 3) * 3, "🔑", 22);
          }
          if (m === 1) {
            for (let i = 0; i < 34; i++)
              g.fillStyle(ink, 0.43).fillRoundedRect(
                ((i * 25 + clock * 22) % 830) - 12,
                280,
                12,
                4,
                2,
              );
            [350, 565].forEach((x) => {
              box(x - 14, 250, 28, 28, 0xe49c5e);
              g.fillStyle(0xffde9b).fillTriangle(
                x - 8,
                269,
                x,
                255,
                x + 8,
                269,
              );
            });
            const y = Math.min(...v.players.map((p) => p.y)) - 57;
            box(v.box - 31, y, 62, 46, 0xcd905a);
            box(v.box - 24, y + 5, 48, 35, 0xeac686);
            g.lineStyle(3, 0x9e664b).lineBetween(
              v.box - 20,
              y + 34,
              v.box + 20,
              y + 10,
            );
            this.word(v.box, y + 22, "★", 16);
          }
          if (m === 2) {
            for (let c = 0; c < 24; c++) {
              const x = 243 + (c % 6) * 53,
                y = 36 + Math.floor(c / 6) * 46;
              const near =
                Math.abs((c % 6) - (v.cell % 6)) +
                  Math.abs(Math.floor(c / 6) - Math.floor(v.cell / 6)) <=
                1;
              const route = v.maze.includes(c);
              box(
                x,
                y,
                47,
                40,
                v.maze.length
                  ? route
                    ? 0xe5bc67
                    : 0x627e73
                  : near
                    ? 0xadc8aa
                    : 0x485260,
                7,
              );
              if (route)
                g.fillStyle(
                  0xffef9d,
                  0.7 + Math.sin(clock * 3 + c) * 0.2,
                ).fillCircle(x + 23, y + 20, 4);
              if (v.cell === c) this.word(x + 23, y + 19, "◆", 20);
              if (c === 23 && (v.maze.length || near))
                this.word(x + 23, y + 17, "⚑", 18);
            }
          }
          if (m === 3) {
            box(255, 89, 290, 81, 0x443c61, 12);
            const colors = [0xff8fba, 0xf6cf70, 0x80eac8, 0xad9af9];
            for (let i = 0; i < 4; i++) {
              const bright =
                v.sequence.length &&
                v.sequence[Math.floor(clock * 1.6) % v.sequence.length] === i;
              box(269 + i * 67, 107, 59, 43, colors[i]);
              if (bright)
                g.lineStyle(4, 0xfff4c2).strokeRoundedRect(
                  267 + i * 67,
                  105,
                  63,
                  47,
                  6,
                );
              this.word(299 + i * 67, 128, fruit[i], 10);
            }
          }
          if (m === 4) {
            box(108, 262, 15, 16, 0x977b90);
            g.lineStyle(4, ink).lineBetween(
              115,
              265,
              v.bridge ? 125 : 105,
              250,
            );
            g.fillStyle(0xffcb6f).fillCircle(v.bridge ? 125 : 105, 250, 5);
            this.word(114, 232, "BRIDGE");
            this.word(742, 242, "⚑ EXIT");
          }
          if (m === 5) {
            box(287, 184, 226, 76, 0xb66e55, 15);
            box(280, 177, 240, 11, 0xf4c391);
            box(365, 204, 70, 50, 0x65454e, 10);
            g.fillStyle(0xffa651, 0.8).fillEllipse(
              400,
              240,
              49,
              16 + Math.sin(clock * 6) * 3,
            );
            this.word(
              400,
              166,
              v.tray.length
                ? "🍕 " + v.tray.map((n) => toppings[n]).join(" · ")
                : "🍕",
              13,
            );
            for (let i = 0; i < 4; i++)
              g.fillStyle(0xfff0d6, 0.22).fillEllipse(
                388 + i * 9 + Math.sin(clock + i) * 5,
                138 - ((clock * 14 + i * 7) % 28),
                6,
                12,
              );
          }
          }
          if (old && old !== v) {
            if (v.mistakes > old.mistakes) {
              this.impact = t + 340;
              this.feedback = "Oops!";
              this.feedbackUntil = t + 700;
              if (!this.reduced) this.cameras.main.shake(80, 0.0014);
              this.burst(m === 1 ? v.box : 400, 220, 0xffa1ac);
            } else if (
              v.correct > old.correct ||
              (v.keyTaken && !old.keyTaken)
            ) {
              this.feedback = "+" + Math.max(1, v.correct - old.correct);
              this.feedbackUntil = t + 700;
              this.reach = t + 390;
              this.burst(
                v.keyTaken && !old.keyTaken ? 665 : 400,
                180,
                0xffdf78,
                14,
              );
            }
            if (
              v.bridge !== old.bridge ||
              v.relay !== old.relay ||
              v.stock.join() !== old.stock.join() ||
              v.tray.join() !== old.tray.join()
            )
              this.reach = t + 350;
            if (v.gate && !old.gate) this.burst(220, 267, 0xa3f6be);
            if (won && old.phase !== "results") {
              for (let i = 0; i < 4; i++)
                this.burst(
                  170 + i * 155,
                  170,
                  [0xffc979, 0xff94b4, 0x91edce, 0xbda5f4][i],
                  14,
                );
            }
          }
          v.players.forEach((p, i) => {
            const a = this.actors[i],
              target = res
                ? 225 + i * 350
                : [2, 3, 5].includes(m)
                  ? 140 + i * 520
                  : p.x;
            if (!this.previous) {
              a.x = target;
              a.y = p.y;
            }
            const blend = 1 - Math.exp(-dt * 17);
            a.x += (target - a.x) * blend;
            a.y += (p.y - a.y) * blend;
            a.speed +=
              (Math.min(220, Math.abs(target - a.x) * 18) - a.speed) * blend;
            if (!a.ground && p.ground) {
              a.land = t + 140;
              this.burst(a.x, p.y - 2, 0xffdcad, 5);
              if (p.id === id) arcadeAudio.cue("land");
            }

            let pose: Pose = "idle";
            if (a.speed > 8) pose = a.speed > 128 ? "run" : "walk";
            if (m === 1 && a.speed > 8 && Math.abs(p.x - v.box) < 65)
              pose = p.x < v.box === p.dir > 0 ? "push" : "pull";
            if (!p.ground) pose = p.vy < 0 ? "jump" : "fall";
            if (a.ground && !p.ground && p.vy < 0) a.anticipate = t + 65;
            if (a.land > t) pose = "land";
            if (a.anticipate > t) pose = "anticipation";
            if (old && p.gestures !== old.players[i]?.gestures)
              a.gesture = t + 360;
            if ((a.gesture > t || (this.reach > t && p.id === id)) && p.ground)
              pose = "interact";
            if (this.impact > t) pose = "hit";
            a.ground = p.ground;
            const [sender, message] = emote.split("|");
            if (sender === p.id && emotes[message]) pose = emotes[message];
            if (res)
              pose = won
                ? v.history.at(-1)!.stars === 3
                  ? i
                    ? "victory"
                    : "celebrate"
                  : "laugh"
                : "confused";
            if (
              live &&
              p.ground &&
              a.speed > 45 &&
              t - a.step > 310 &&
              id === p.id
            ) {
              arcadeAudio.cue("step");
              a.step = t;
            }
            const entrance =
              v.intro && !this.reduced ? Math.min(1, v.intro / 1.8) ** 3 : 0;
            const x = a.x + (i ? 1 : -1) * entrance * 52;
            g.fillStyle(ink, 0.19).fillEllipse(x, 278, 43, 7);
            drawPuppet(
              g,
              x,
              a.y,
              p,
              pose,
              this.reduced ? 0 : t + i * 313,
              this.reduced,
            );
            this.word(x, a.y - 79, p.name, 10);
          });
          this.previous = v;
          if (this.feedbackUntil > t)
            this.word(
              400,
              183 - (700 - this.feedbackUntil + t) * 0.035,
              this.feedback,
              18,
            );
          for (let i = this.particles.length - 1; i >= 0; i--) {
            const f = this.particles[i];
            f.life -= dt;
            if (f.life <= 0) {
              this.particles.splice(i, 1);
              continue;
            }
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.vy += 95 * dt;
            g.fillStyle(f.color, Math.min(1, f.life * 2)).fillTriangle(
              f.x,
              f.y - 3,
              f.x - 2,
              f.y + 2,
              f.x + 3,
              f.y + 1,
            );
          }
          this.words.slice(this.index).forEach((o) => o.setVisible(false));
        }
      }
      game = new P.Game({
        type: P.CANVAS,
        parent: host.current,
        width: host.current.clientWidth,
        height: host.current.clientHeight,
        scale: { mode: P.Scale.RESIZE },
        backgroundColor: "#726a89",
        scene: Stage,
        banner: false,
        audio: { noAudio: true },
      });
    });
    return () => {
      dead = true;
      game?.destroy(true);
    };
  }, []);
  return (
    <div
      ref={host}
      className="worldCanvas"
      aria-label="Live two-player game world"
    />
  );
}
