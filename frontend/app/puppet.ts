import type { Player } from "../../shared/model";

export type Pose =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "fall"
  | "land"
  | "push"
  | "pull"
  | "interact"
  | "celebrate"
  | "laugh"
  | "cry"
  | "confused"
  | "facepalm"
  | "hit"
  | "victory"
  | "anticipation";

type Pen = Phaser.GameObjects.Graphics;
const ink = 0x342d42;
const parchment = 0xffefd7;
const blush = 0xf99ca1;
const sole = 0x79525b;
const gold = 0xffce72;

function oval(
  g: Pen,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  edge = 1.5,
) {
  g.fillStyle(color).fillEllipse(x, y, width, height, 20);
  if (edge) g.lineStyle(edge, ink).strokeEllipse(x, y, width, height, 20);
}

function shoe(g: Pen, x: number, y: number, angle: number) {
  g.save().translateCanvas(x, y).rotateCanvas(angle);
  oval(g, 1, -1.2, 13.5, 8.5, sole);
  g.lineStyle(1.3, 0xf5c599).lineBetween(-3.8, 0.8, 6, 0.8);
  g.restore();
}

function sleeve(g: Pen, x: number, y: number, angle: number, color: number) {
  g.save().translateCanvas(x, y).rotateCanvas(angle);
  oval(g, 0, 4.8, 7.3, 14, color);
  oval(g, 0, 11, 8.2, 7.3, parchment, 1.1);
  g.restore();
}

function ear(g: Pen, x: number, tilt: number, h: number, color: number) {
  g.save().translateCanvas(x, -40).rotateCanvas(tilt);
  oval(g, 0, -h / 2, 10.7, h, color, 1.8);
  oval(g, 0.3, -h / 2 - 0.5, 4.4, h * 0.68, blush, 0);
  g.restore();
}

function leaf(g: Pen, tilt: number, h: number, tint: number) {
  g.save().translateCanvas(-1, -45).rotateCanvas(tilt);
  oval(g, 0, -h / 2, 10, h, tint);
  g.lineStyle(1, 0x3e705d).lineBetween(0, -1, 0, -h + 3);
  g.restore();
}

function emblem(g: Pen, avatar: string) {
  g.save().translateCanvas(7, -13);
  oval(g, 0, 0, 9, 9, gold, 1);
  g.fillStyle(ink);
  if (avatar === "♥") {
    g.fillCircle(-1, -0.6, 1.25)
      .fillCircle(1, -0.6, 1.25)
      .fillTriangle(-2.1, 0, 2.1, 0, 0, 2.4);
  } else if (avatar === "✿") {
    for (let i = 0; i < 5; i++)
      g.fillCircle(Math.cos(i * 1.257) * 1.35, Math.sin(i * 1.257) * 1.35, 1);
    g.fillStyle(parchment).fillCircle(0, 0, 0.7);
  } else if (avatar === "☻") {
    g.fillCircle(-1.2, -0.9, 0.7).fillCircle(1.2, -0.9, 0.7);
    g.lineStyle(0.8, ink).beginPath().arc(0, 0, 1.7, 0.2, 2.9).strokePath();
  } else {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        r = i % 2 ? 1.2 : 2.8;
      if (i) g.lineTo(r * Math.cos(a), r * Math.sin(a));
      else g.moveTo(r * Math.cos(a), r * Math.sin(a));
    }
    g.closePath().fillPath();
  }
  g.restore();
}

function eye(g: Pen, x: number, y: number, closed: boolean, worried: boolean) {
  if (closed) {
    g.lineStyle(1.7, ink)
      .beginPath()
      .arc(x, y + 1, 2.1, Math.PI + 0.12, 2 * Math.PI - 0.12)
      .strokePath();
    return;
  }
  oval(g, x, y, 3.7, 5.9, ink, 0);
  g.fillStyle(0xffffff).fillCircle(x + 0.45, y - 1.25, 0.7);
  if (worried) g.lineStyle(1.3, ink).lineBetween(x - 2, y - 5, x + 2, y - 6);
}

/** Draw in canonical world units. t is the monotonic Phaser frame time in milliseconds. */
export function drawPuppet(
  g: Pen,
  x: number,
  y: number,
  p: Player,
  pose: Pose,
  t: number,
  reduced: boolean,
): void {
  const suit = parseInt((p.cosmetic==="violet-dye"?"#b894ef":p.color).slice(1),16);
  const clock = reduced ? 0 : t;
  const offset = p.id.charCodeAt(p.id.length - 1) || 0;
  const beat = Math.sin(clock * 0.006 + offset);
  const walking = pose === "walk" || pose === "run";
  const running = pose === "run";
  const step = walking
    ? Math.sin(clock * (running ? 0.019 : 0.011) + offset)
    : 0;
  const joy = pose === "celebrate" || pose === "victory";
  const strain = pose === "push" || pose === "pull";
  const squat = pose === "land" || pose === "anticipation";
  const air = pose === "jump" || pose === "fall";
  const hop = joy
    ? (reduced ? 0 : Math.abs(beat)) * (pose === "celebrate" ? 5 : 1.7)
    : 0;
  const lift =
    hop +
    Math.abs(step) * (running ? 2 : 1.1) +
    (pose === "laugh" ? Math.abs(beat) * 1.6 : 0);
  const scaleY = squat ? 0.82 : pose === "jump" ? 1.1 : 1 + beat * 0.013;
  const tilt =
    pose === "hit"
      ? -0.18
      : pose === "confused"
        ? -0.1
        : pose === "pull"
          ? -0.12
          : running || pose === "push"
            ? 0.1
            : 0;
  g.save()
    .translateCanvas(x, y)
    .scaleCanvas(p.dir < 0 ? -1 : 1, 1);
  g.translateCanvas(0, -lift)
    .rotateCanvas(tilt)
    .scaleCanvas(1 / scaleY, scaleY);
  const stride = step * (running ? 7.4 : 4.3);
  shoe(
    g,
    -9 - stride,
    -3 - Math.max(0, -step) * 3 - (air ? 4 : 0),
    step * 0.22,
  );
  shoe(
    g,
    8 + stride,
    -3 - Math.max(0, step) * 3 - (air ? 1.7 : 0),
    -step * 0.24,
  );

  let nearArm = -0.23 - step * 0.77,
    farArm = 0.25 + step * 0.72;
  if (air) {
    nearArm = pose === "jump" ? -2.2 : -1.65;
    farArm = 1.7;
  }
  if (joy) {
    nearArm = -2.55 + beat * 0.15;
    farArm = 2.42 - beat * 0.15;
  }
  if (strain) {
    nearArm = pose === "pull" ? -1.07 : -1.58;
    farArm = -1.15;
  }
  if (pose === "interact") nearArm = -1.7 + beat * 0.35;
  if (pose === "laugh") nearArm = 1.0;
  if (pose === "cry") nearArm = 2.55;
  if (pose === "confused" || pose === "facepalm") nearArm = 2.8;
  if (pose === "hit") {
    nearArm = -1.4;
    farArm = 1.5;
  }
  sleeve(g, -17, -21, farArm, suit);

  const sway = beat * 0.06 + step * 0.16 + (air ? -0.2 : 0);
  if (p.shape === "Sprout") {
    leaf(g, -0.89 + sway, 18, 0x70ae82);
    leaf(g, 0.74 + sway * 0.7, 21, 0x97d59b);
  } else {
    ear(g, -9, -0.24 + sway, 22, suit);
    ear(g, 7, 0.18 + sway * 0.7, 26, suit);
  }
  // A warm face patch and a knotted neckerchief distinguish the head from the jacket.
  oval(g, 0, -26.5, 43, 44, suit, 2.2);
  oval(g, 1.5, -31, 34.2, 23.5, parchment, 0);
  g.fillStyle(0xffffff, 0.48).fillEllipse(-9, -43.6, 8, 2.6, 12);
  g.fillStyle(blush, 0.7)
    .fillEllipse(-9, -27.6, 5.7, 2.7, 12)
    .fillEllipse(12, -27.6, 5.7, 2.7, 12);
  const blink = !reduced && (clock + offset * 91) % 3200 < 105;
  const closed = blink || pose === "laugh" || joy || pose === "hit" || strain;
  const worried = pose === "confused" || pose === "cry" || pose === "fall";
  eye(g, -5, -33, closed, worried);
  eye(g, 8, -33 - (pose === "confused" ? 1.3 : 0), closed, worried);
  if (
    pose === "laugh" ||
    pose === "celebrate" ||
    pose === "fall" ||
    pose === "hit"
  ) {
    oval(g, 2, -25.6, pose === "laugh" ? 6.5 : 4.5, 4.8, ink, 0);
    g.fillStyle(blush).fillEllipse(2, -24.3, 3, 1.4, 10);
  } else {
    g.lineStyle(1.45, ink)
      .beginPath()
      .arc(
        2,
        worried ? -24 : -28,
        3.2,
        worried ? 3.47 : 0.26,
        worried ? 5.9 : 2.88,
      )
      .strokePath();
  }
  if (pose === "cry") {
    const drip = reduced ? 1 : (clock * 0.013) % 6;
    oval(g, -5, -28 + drip, 2.5, 4.5, 0x72cee8, 0);
    oval(g, 9, -27 + (6 - drip), 2.2, 3.3, 0x72cee8, 0);
  }

  g.fillStyle(0xe37264).fillTriangle(-17, -21, -7, -18, -18 + sway * 4, -10);
  g.lineStyle(3.5, 0xbc625e)
    .beginPath()
    .moveTo(-15, -20)
    .lineTo(-7, -16.5)
    .lineTo(2, -17.2)
    .strokePath();
  g.lineStyle(1.2, 0xffd584).lineBetween(-14, -20.5, -7, -18);
  emblem(g, p.avatar);
  const palm = pose === "facepalm" || pose === "cry" || pose === "confused";
  sleeve(g, palm ? 12 : 18, palm ? -25 : -21, nearArm, suit);
  if (pose === "victory") {
    g.fillStyle(gold)
      .fillTriangle(24, -47, 27, -43, 24, -38)
      .fillTriangle(24, -47, 21, -43, 24, -38);
  }
  if(p.cosmetic?.includes('hat')||p.cosmetic?.includes('cap')||p.cosmetic?.includes('crown')){
    g.fillStyle(p.cosmetic.includes('gold')?0xffd461:0xa78cdb).fillRoundedRect(-19,-57,38,7,3);
    if(p.cosmetic.includes('crown'))g.fillTriangle(-17,-57,-17,-73,-3,-57).fillTriangle(-10,-57,0,-78,10,-57).fillTriangle(3,-57,17,-73,17,-57);
    else g.fillRoundedRect(-13,-72,26,16,5);
  }
  if(p.cosmetic?.includes('pin')){g.fillStyle(0xffd461).fillCircle(-10,-17,5);g.lineStyle(1,ink).strokeCircle(-10,-17,5)}
  g.restore();
}
