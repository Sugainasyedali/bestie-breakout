import type { View } from "../../shared/model";
type Pen = Phaser.GameObjects.Graphics;
function gear(g: Pen, x: number, y: number, r: number, t: number) {
  g.save().translateCanvas(x, y).rotateCanvas(t);
  g.fillStyle(0x906d77);
  for (let i = 0; i < 8; i++) {
    g.rotateCanvas(Math.PI / 4);
    g.fillRoundedRect(-r * 0.19, -r * 1.16, r * 0.38, r * 0.44, 2);
  }
  g.fillStyle(0xcb996c).fillCircle(0, 0, r);
  g.lineStyle(2, 0x705769).strokeCircle(0, 0, r);
  for (let i = 0; i < 3; i++) {
    g.rotateCanvas(Math.PI / 3);
    g.lineStyle(2, 0x916776).lineBetween(-r * 0.69, 0, r * 0.69, 0);
  }
  g.fillStyle(0xffdc99).fillCircle(0, 0, r * 0.25);
  g.restore();
}
// These layers follow the camera at a fraction of foreground speed.
export function scenery(g: Pen, v: View, t: number, shift: number) {
  g.save().translateCanvas(-shift, 0);
  switch (v.mission) {
    case 0:
      for (const x of [55, 699]) {
        g.lineStyle(2, 0x65556b).lineBetween(x, 70, x, 140);
        g.fillStyle(0xe17687).fillTriangle(
          x,
          72,
          x + 27 + Math.sin(t * 2) * 3,
          78 + Math.cos(t * 2) * 3,
          x,
          91,
        );
        g.fillStyle(0xffdb9b).fillCircle(x, 68, 3);
      }
      gear(g, 480, 99, 10, v.time * 0.25);
      break;
    case 1:
      gear(g, 65, 198, 27, t * 0.32);
      gear(g, 104, 186, 15, -t * 0.5);
      gear(g, 707, 192, 24, -t * 0.32);
      for (let i = 0; i < 5; i++) {
        g.fillStyle(
          i === Math.floor(t * 2) % 5 ? 0xffec9d : 0xb4917c,
        ).fillCircle(620 + i * 13, 193, 3);
      }
      break;
    case 2:
      for (let i = 0; i < 9; i++) {
        const x = 36 + i * 94 + Math.sin(t + i) * 4,
          y = 105 + Math.sin(i * 71) * 42;
        g.fillStyle(0xffdd76, 0.17).fillCircle(x, y, 8);
        g.fillStyle(0xffefac, 0.8).fillCircle(x, y, 2);
      }
      for (let i = 0; i < 4; i++)
        g.fillStyle(0xadd1be, 0.095).fillEllipse(
          130 + i * 187 + Math.sin(t * 0.4 + i) * 20,
          205 + (i % 2) * 19,
          173,
          13,
        );
      break;
    case 3:
      for (let i = 0; i < 13; i++) {
        const h = 6 + Math.abs(Math.sin(t * 2 + i * 0.9)) * 25;
        g.fillStyle(i % 2 ? 0x69e1cc : 0xf0a0cc, 0.7).fillRoundedRect(
          328 + i * 12,
          84 - h,
          7,
          h,
          2,
        );
      }
      break;
    case 4:
      for (let i = 0; i < 5; i++) {
        const x = ((t * (2 + i) + i * 192) % 1050) - 125,
          y = 190 + Math.sin(i * 62) * 28;
        g.fillStyle(0xfff4e1, 0.52)
          .fillEllipse(x, y, 67, 11)
          .fillEllipse(x - 10, y - 4, 29, 15);
      }
      break;
    case 5:
      for (let i = 0; i < 3; i++) {
        const x = 316 + i * 88;
        g.lineStyle(2, 0x66505a).lineBetween(x, 52, x, 75);
        g.fillStyle(0xffd091, 0.75).fillEllipse(x, 78, 26, 9);
        g.fillStyle(0xffe0a9, 0.11).fillTriangle(
          x - 9,
          80,
          x + 9,
          80,
          x + 33,
          146,
        );
      }
      break;
  }
  g.restore();
}
