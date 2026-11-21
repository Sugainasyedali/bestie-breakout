"use client";
import { useEffect, useRef } from "react";
import { bridgeCenter, type View, type Input } from "../../shared/model";
type Props = {
  v: View;
  id: string;
  send: (i: Input) => void;
  act: () => void;
  pause: () => void;
  sfx: (n: number) => void;
  emote: string;
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
        labels: Phaser.GameObjects.Text[] = [];
        idx = 0;
        terrain: Phaser.Physics.Arcade.Image[] = [];
        keys!: Record<string, Phaser.Input.Keyboard.Key>;
        last = "";
        bodies: Phaser.Physics.Arcade.Image[] = [];
        create() {
          this.g = this.add.graphics();
          this.keys = this.input.keyboard!.addKeys(
            "A,D,W,LEFT,RIGHT,SPACE,E,ESC",
          ) as typeof this.keys;
          const ledge = (x: number, width: number) => {
            const platform = this.physics.add
              .staticImage(x, 310, "__WHITE")
              .setDisplaySize(width, 64)
              .refreshBody()
              .setVisible(false);
            this.terrain.push(platform);
          };
          if (latest.current.v.mission === 4) {
            ledge(130, 260);
            ledge(670, 260);
          } else ledge(400, 800);
          for (let i = 0; i < 2; i++) {
            const b = this.physics.add
              .image(0, 0, "__WHITE")
              .setOrigin(0.5, 1)
              .setDisplaySize(30, 38)
              .setVisible(false);
            this.physics.add.collider(b, this.terrain);
            this.bodies.push(b);
          }
        }
        label(x: number, y: number, s: string, size = 15, color = "#252a36") {
          const t =
            this.labels[this.idx++] ||
            this.add
              .text(0, 0, "", { fontFamily: "system-ui", fontStyle: "bold" })
              .setOrigin(0.5);
          this.labels[this.idx - 1] = t;
          t.setPosition(x, y)
            .setText(s)
            .setFontSize(size)
            .setColor(color)
            .setVisible(true);
        }
        update(_t: number, delta: number) {
          const { v, id, send, act, pause, sfx, emote } = latest.current,
            g = this.g;
          this.idx = 0;
          g.clear();
          const move =
              Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
              Number(this.keys.A.isDown || this.keys.LEFT.isDown),
            jump =
              P.Input.Keyboard.JustDown(this.keys.SPACE) ||
              P.Input.Keyboard.JustDown(this.keys.W);
          if (String(move) !== this.last || jump) {
            send({ move, jump });
            this.last = String(move);
            if (jump) sfx(410);
          }
          if (P.Input.Keyboard.JustDown(this.keys.E)) act();
          if (P.Input.Keyboard.JustDown(this.keys.ESC)) pause();
          const ink = 0x292635,
            rect = (
              x: number,
              y: number,
              w: number,
              h: number,
              c: number,
              r = 5,
            ) => {
              g.fillStyle(c).fillRoundedRect(x, y, w, h, r);
              g.lineStyle(3, ink).strokeRoundedRect(x, y, w, h, r);
            };
          g.fillStyle(
            [0xb6ece3, 0xffdcac, 0xc9ede4, 0xdbc8f7, 0xbce5fb, 0xffdbc9][
              v.mission
            ],
          ).fillRect(0, 0, 800, 330);
          for (let j = 0; j < 8; j++) {
            const x = j * 121 - 18,
              y = 150 + (j % 3) * 24;
            g.fillStyle(0xffffff, 0.55).fillEllipse(
              x,
              46 + (j % 3) * 20,
              85,
              18,
            );
            g.fillStyle(0x91bdae, 0.55).fillTriangle(
              x - 110,
              290,
              x,
              y,
              x + 142,
              290,
            );
          }
          const land = (x: number, w: number) => {
            rect(x, 278, w, 85, 0xc3a48d);
            rect(x, 277, w, 14, 0x87cd91);
          };
          if (v.mission === 4) {
            land(-5, 265);
            land(540, 270);
            if (v.bridge)
              rect(bridgeCenter(v.time) - 75, 278, 150, 14, 0xfac75b);
          } else land(-5, 810);
          if (v.mission === 0) {
            rect(192, 270, 56, 8, v.gate ? 0x71dbb5 : 0xff819c);
            rect(314, 236, 32, 42, 0xe7b184);
            if (!v.gate) rect(464, 128, 22, 150, 0xb393e5);
            this.label(570, 250, "⚑ RELAY");
            this.label(748, 248, "EXIT");
            if (!v.keyTaken) this.label(665, 218, "🔑", 24);
          }
          if (v.mission === 1) {
            [350, 565].forEach((x) => rect(x - 14, 250, 28, 28, 0xde8e64));
            rect(
              v.box - 30,
              Math.min(...v.players.map((p) => p.y)) - 52,
              60,
              46,
              0xddaa72,
            );
            this.label(v.box, Math.min(...v.players.map((p) => p.y)) - 30, "★");
          }
          if (v.mission === 4) {
            this.label(114, 236, "BRIDGE SWITCH");
            this.label(738, 238, "⚑ EXIT");
          }
          if (v.mission === 2) {
            for (let c = 0; c < 24; c++) {
              const x = 240 + (c % 6) * 54,
                y = 34 + Math.floor(c / 6) * 47;
              const nearby =
                Math.abs((c % 6) - (v.cell % 6)) +
                  Math.abs(Math.floor(c / 6) - Math.floor(v.cell / 6)) <=
                1;
              rect(
                x,
                y,
                49,
                42,
                v.maze.length
                  ? v.maze.includes(c)
                    ? 0xffd766
                    : 0xa8ceb9
                  : nearby
                    ? 0xe5e1c6
                    : 0x78798d,
              );
              if (c === v.cell) this.label(x + 24, y + 20, "●");
              if (c === 23 && (v.maze.length || nearby))
                this.label(x + 24, y + 20, "⚑");
            }
          }
          if (v.mission === 3 || v.mission === 5) {
            rect(215, 65, 370, 104, 0xfff8e6);
            this.label(
              400,
              90,
              v.mission === 3 ? "SIGNAL STATION" : "PIZZA KITCHEN",
              19,
            );
            this.label(
              400,
              132,
              v.mission === 3 ? "●   ◆   ★   ♥" : "🍅      🍕      🧀",
              25,
            );
          }
          v.players.forEach((p, i) => {
            const targetX = [2, 3, 5].includes(v.mission) ? 135 + i * 530 : p.x;
            const body = this.bodies[i];
            if (
              Math.abs(body.x - targetX) > 120 ||
              Math.abs(body.y - p.y) > 100
            )
              body.setPosition(targetX, p.y);
            const rate =
              ((1 - Math.exp(-Math.max(delta, 1) / 48)) * 1000) /
              Math.max(delta, 1);
            body.setVelocity((targetX - body.x) * rate, (p.y - body.y) * rate);
            const x = body.x,
              y = body.y + Math.sin(_t / 155 + i) * (p.ground ? 1.5 : 0),
              c = parseInt(p.color.slice(1), 16);
            const step =
              p.ground && Math.abs(body.x - targetX) > 1
                ? Math.sin(_t / 65) * 4
                : 0;
            rect(x - 19, y - 9 + step, 13, 9, ink);
            rect(x + 6, y - 9 - step, 13, 9, ink);
            if (p.shape === "Bunny") {
              rect(x - 17, y - 59, 11, 26, c);
              rect(x + 3, y - 56, 11, 24, c);
            } else {
              g.fillStyle(0x559666).fillEllipse(x + 5, y - 49, 22, 13);
            }
            rect(x - 23, y - 44, 46, 38, c, 15);
            g.fillStyle(ink)
              .fillEllipse(x - 7, y - 29, 4, 7)
              .fillEllipse(x + 8, y - 29, 4, 7);
            g.lineStyle(2, ink)
              .beginPath()
              .arc(x + 1, y - 24, 4, 0, Math.PI)
              .strokePath();
            this.label(x, y - 75, p.name + (p.id === id ? " • YOU" : ""), 13);
          });
          if (emote) this.label(400, 16, emote, 16);
          this.labels.slice(this.idx).forEach((t) => t.setVisible(false));
        }
      }
      game = new P.Game({
        type: P.CANVAS,
        parent: host.current,
        width: 800,
        height: 330,
        scale: { mode: P.Scale.FIT, autoCenter: P.Scale.CENTER_BOTH },
        physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
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
    <div className="arena" ref={host} aria-label="Live two-player game field" />
  );
}
