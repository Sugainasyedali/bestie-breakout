import type { Board, Stage } from "../../shared/content/engine";

type Pen = Phaser.GameObjects.Graphics;
type Label = (x: number, y: number, text: string, size?: number) => void;
type Material = { floor: number; light: number; wall: number; top: number; trim: number };

const ink = 0x383248;
const ivory = 0xfff2ce;
const gold = 0xffcf63;
const pink = 0xf596af;
const mint = 0x79d9bf;
const glyphColors = [pink, gold, mint, 0xb7adf3];
const materials: Material[] = [
  { floor: 0xe8cfc3, light: 0xf2ddd0, wall: 0x9f8194, top: 0xd6b3bd, trim: 0xdbb47e },
  { floor: 0xeed3ae, light: 0xf7dfba, wall: 0xb18273, top: 0xe6b58d, trim: 0xaac6b9 },
  { floor: 0xc4d8b3, light: 0xd6e2c1, wall: 0x628a7b, top: 0x98ba98, trim: 0xc4bd8d },
  { floor: 0x8e83a7, light: 0xa398b7, wall: 0x655878, top: 0x9980ae, trim: 0x93dcd5 },
  { floor: 0xc5d8e3, light: 0xe0e8eb, wall: 0x8b86a8, top: 0xbab2ca, trim: 0xffd899 },
  { floor: 0xf1cbb7, light: 0xf5ddc4, wall: 0xb78380, top: 0xdfafa1, trim: 0xb3cfad },
];

function disk(g: Pen, x: number, y: number, radius: number, color: number, edge = 1.4) {
  g.fillStyle(color).fillCircle(x, y, radius);
  if (edge) g.lineStyle(edge, ink).strokeCircle(x, y, radius);
}

function box(g: Pen, x: number, y: number, w: number, h: number, radius: number, color: number, edge = 1) {
  g.fillStyle(color).fillRoundedRect(x, y, w, h, radius);
  if (edge) g.lineStyle(edge, ink).strokeRoundedRect(x, y, w, h, radius);
}

function star(g: Pen, x: number, y: number, s: number, color: number) {
  g.fillStyle(color).beginPath().moveTo(x, y - s);
  for (let i = 1; i < 8; i++) {
    const theta = i * Math.PI / 4 - Math.PI / 2;
    const r = i % 2 ? s * 0.32 : s;
    g.lineTo(x + Math.cos(theta) * r, y + Math.sin(theta) * r);
  }
  g.closePath().fillPath();
}

function glyph(g: Pen, x: number, y: number, index: number, size: number) {
  g.fillStyle(ink);
  switch (index) {
    case 0: g.fillCircle(x, y, size * 0.64); break;
    case 1: g.fillTriangle(x, y - size * 0.86, x - size * 0.8, y + size * 0.59, x + size * 0.8, y + size * 0.59); break;
    case 2: g.fillRoundedRect(x - size * 0.63, y - size * 0.63, size * 1.26, size * 1.26, 1.2); break;
    default: star(g, x, y, size, ink);
  }
}

function masonry(g: Pen, world: number, m: Material, tile: number, cell: number) {
  const h = tile / 2;
  box(g, -h + 0.5, -h + 1.5, tile - 1, tile - 1.5, 2.5, m.wall, 1.1);
  box(g, -h + 0.6, -h + 0.1, tile - 1.2, tile * 0.78, 2.5, m.top, 0.85);
  g.lineStyle(1.1, ivory, 0.65).lineBetween(-h + 3, -h + 2.4, h - 4, -h + 2.4);
  g.lineStyle(1, ink, 0.32);
  if (world === 2) {
    g.beginPath().arc(-tile * 0.12, -tile * 0.07, tile * 0.17, Math.PI, Math.PI * 1.9).strokePath();
    g.lineBetween(1, 0, tile * 0.13, -tile * 0.12);
    return;
  }
  if (world === 1 || world === 3) {
    disk(g, -h + 4, -h + 4, 1, m.trim, 0);
    disk(g, h - 4, h - 5, 1, m.trim, 0);
    if (cell % 4 === 1) g.lineStyle(1.6, m.trim).lineBetween(-h + 5, 0, h - 5, 0);
    return;
  }
  g.lineBetween(-h + 2, 0, h - 1, 0);
  const seam = cell % 2 ? -tile * 0.19 : tile * 0.2;
  g.lineBetween(seam, -h + 2, seam, 0);
}

function pawn(g: Pen, x: number, y: number, tile: number, seat: number, time: number) {
  const size = tile / 28;
  const color = seat ? mint : pink;
  g.fillStyle(ink, 0.24).fillEllipse(x, y + tile * 0.32, tile * 0.78, tile * 0.18);
  g.save().translateCanvas(x, y + Math.sin(time * 3 + seat * 3) * 0.65).scaleCanvas(size, size);
  box(g, -8, 5, 6, 6, 2.5, 0x816270);
  box(g, 2, 5, 6, 6, 2.5, 0x816270);
  if (seat === 0) {
    g.fillStyle(color).fillEllipse(-5, -9, 5, 9, 12).fillEllipse(5, -9, 5, 9, 12);
    g.lineStyle(1.3, ink).strokeEllipse(-5, -9, 5, 9, 12).strokeEllipse(5, -9, 5, 9, 12);
  } else {
    g.fillStyle(0x80b896).fillTriangle(-1, -5, 1, -13, 8, -14);
    g.lineStyle(1.3, ink).strokeTriangle(-1, -5, 1, -13, 8, -14);
  }
  box(g, -10, -8, 20, 17, 7, color, 1.5);
  g.fillStyle(ink).fillEllipse(-3.8, -1.4, 2.2, 3.2, 10).fillEllipse(3.8, -1.4, 2.2, 3.2, 10);
  g.lineStyle(1, ink).beginPath().arc(0, 0, 2.3, 0.3, Math.PI - 0.3).strokePath();
  g.fillStyle(0xf5a2a1).fillEllipse(-6.4, 2, 3, 2, 8).fillEllipse(6.4, 2, 3, 2, 8);
  g.restore();
}

export function drawChallenge(
  g: Pen, board: Board, stage: Stage, world: number, word: Label, time: number,
): void {
  // Draw the seat-specific projection. Hidden cells and private symbols must
  // come only from the board delivered to this player.
  const rows = board.tiles;
  if (!rows.length || !rows[0].length) return;
  const columns = rows[0].length;
  const tile = Math.min(40, 486 / columns, 185 / rows.length);
  const w = tile * columns;
  const h = tile * rows.length;
  const left = 400 - w / 2;
  const top = 139 - h / 2;
  const center = (cell: number) => ({
    x: left + ((cell % columns) + 0.5) * tile,
    y: top + (Math.floor(cell / columns) + 0.5) * tile,
  });
  const palette = materials[world] ?? materials[0];
  const half = tile / 2;
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  const sequence = stage.mode === "sequence" || stage.mode === "rhythm";
  const beam = new Set(board.beam);
  const built = new Set(board.built);

  g.fillStyle(ink, 0.18).fillRoundedRect(left - 8, top - 5, w + 16, h + 20, 11);
  box(g, left - 7, top - 9, w + 14, h + 19, 8, palette.wall, 2);
  box(g, left - 6, top - 10, w + 12, h + 15, 8, palette.trim, 1.4);
  for (const dx of [-2, w + 2]) {
    for (const dy of [-5, h + 1]) {
      disk(g, left + dx, top + dy, 1.5, ivory, 0.7);
    }
  }
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < columns; col++) {
      const c = rows[row][col];
      const cell = row * columns + col;
      const { x, y } = center(cell);
      g.save().translateCanvas(x, y);
      if (c === "?") {
        g.fillStyle((row + col) % 2 ? 0x69667f : 0x706f87).fillRect(-half, -half, tile + 0.2, tile + 0.2);
        g.lineStyle(1.4, 0xd7d4e0, 0.35).beginPath().arc(0, 1.5, tile * 0.16, Math.PI, Math.PI * 1.9).strokePath();
        g.restore();
        continue;
      }
      g.fillStyle((row + col) % 2 ? palette.light : palette.floor).fillRect(-half, -half, tile + 0.25, tile + 0.25);
      g.lineStyle(0.65, ink, 0.18).strokeRect(-half, -half, tile, tile);
      if (c === "#") masonry(g, world, palette, tile, cell);
      if (c === "a" || c === "b") {
        const seat = c === "a" ? 0 : 1;
        const active = board.actors[seat] === cell;
        const color = seat ? mint : pink;
        box(g, -tile * 0.39, -tile * 0.25, tile * 0.78, tile * 0.56, tile * 0.12, ink);
        box(g, -tile * 0.36, -tile * (active ? 0.21 : 0.32), tile * 0.72, tile * 0.47, tile * 0.1, color);
        glyph(g, 0, -tile * 0.06, seat, tile * 0.13);
      }
      if (c === "G") {
        g.lineStyle(2, ink, 0.55).strokeCircle(0, 0, tile * 0.35);
        g.lineStyle(2, gold).strokeCircle(0, -1, tile * (0.29 + 0.025 * pulse));
        star(g, 0, -1, tile * 0.20, 0xa77747);
        star(g, 0, -2, tile * 0.16, gold);
      }
      if (c === ">" || c === "<") {
        box(g, -half + 1, -tile * 0.32, tile - 2, tile * 0.64, 3, 0x78838b);
        const dir = c === ">" ? 1 : -1;
        g.lineStyle(1.9, gold).beginPath();
        for (const dx of [-0.19, 0.13]) {
          const offset = (dx + Math.sin(time * 5) * 0.035 * dir) * tile;
          g.moveTo(offset - dir * 3, -4).lineTo(offset + dir * 2, 0).lineTo(offset - dir * 3, 4);
        }
        g.strokePath();
      }
      if (c === "+" || c === "~" || c === "*") {
        const connected = built.has(cell) || board.switchOn;
        box(g, -half + 1, -half + 2, tile - 2, tile - 3, 3, 0x746b7c, 0.8);
        if (c === "~" && stage.labels?.includes("Bounce")) {
          box(g, -tile * 0.08, 0, tile * 0.16, tile * 0.3, 2, ivory);
          g.fillStyle(connected ? mint : pink).beginPath().moveTo(-tile * 0.32, 2)
            .arc(0, 2, tile * 0.32, Math.PI, Math.PI * 2).closePath().fillPath();
          g.lineStyle(1, ink).beginPath().arc(0, 2, tile * 0.32, Math.PI, Math.PI * 2).strokePath();
          g.fillStyle(ivory).fillCircle(-tile * 0.12, -tile * 0.07, 1.4).fillCircle(tile * 0.09, -tile * 0.13, 1.2);
        } else if (c === "~" && stage.mode === "gravity") {
          const sign = connected ? -1 : 1;
          g.lineStyle(2, connected ? mint : gold).lineBetween(0, -tile * 0.2 * sign, 0, tile * 0.14 * sign);
          g.fillStyle(connected ? mint : gold).fillTriangle(-tile * 0.16, tile * 0.08 * sign, tile * 0.16, tile * 0.08 * sign, 0, tile * 0.28 * sign);
        } else if (c === "+" && built.has(cell)) {
          for (let j = 0; j < 3; j++) box(g, -half + 3, -half + 3 + j * tile * 0.28, tile - 6, tile * 0.24, 1, 0xd7ac7e);
        } else if (c === "*") {
          disk(g, 0, 0, tile * 0.31, connected ? mint : gold);
          g.lineStyle(1.6, ink).lineBetween(-tile * 0.07, 0, tile * 0.08, 0);
        } else {
          g.lineStyle(1.2, connected ? mint : 0xffb690, 0.85);
          for (let j = -1; j <= 1; j++) {
            const dx = j * tile * 0.22;
            if (c === "~") {
              const wave = Math.sin(time * 4 + j) * 1.5;
              g.beginPath().moveTo(dx - 1, 5).lineTo(dx + wave, 0).lineTo(dx - wave, -5).strokePath();
            } else g.lineBetween(dx - 2, -half + 4, dx + 2, -half + 4);
          }
        }
      }
      if (c === "/" || c === "\\") {
        const rise = (c === "/" ? -1 : 1) * tile * 0.29;
        g.lineStyle(5, ink).lineBetween(-tile * 0.29, -rise, tile * 0.29, rise);
        g.lineStyle(2.7, 0xb4f5ec).lineBetween(-tile * 0.29, -rise, tile * 0.29, rise);
        disk(g, 0, 0, 2.2, gold, 0.65);
      }
      if (beam.has(cell)) g.fillStyle(gold, 0.22).fillRoundedRect(-half + 1, -half + 1, tile - 2, tile - 2, 3);
      g.restore();
    }
  }

  if (stage.mode === "mirrors" && board.beam.length) {
    const ray = [board.actors[0], ...board.beam].map(center);
    for (const [width, alpha] of [[5, 0.22], [1.7, 1]]) {
      g.lineStyle(width, gold, alpha).beginPath().moveTo(ray[0].x, ray[0].y);
      for (const point of ray.slice(1)) g.lineTo(point.x, point.y);
      g.strokePath();
    }
  }
  if (board.box >= 0) {
    const { x, y } = center(board.box);
    const s = tile * 0.68;
    if (world === 0 && stage.mode === "conveyor") {
      // The roller is a cast-iron cannonball on the castle's transfer rails.
      disk(g, x, y, s * 0.52, 0x677080);
      g.lineStyle(2.4, 0xcdc7d0).beginPath().arc(x, y, s * 0.35, 3.55, 4.64).strokePath();
      disk(g, x + s * 0.15, y + s * 0.19, 1.4, 0x444858, 0);
    } else if (world === 2 && stage.mode === "cargo") {
      g.fillStyle(0xcb9660).fillEllipse(x, y, s * 0.82, s, 20);
      g.lineStyle(1.5, ink).strokeEllipse(x, y, s * 0.82, s, 20);
      g.fillStyle(0x87b47b).fillTriangle(x, y - s * 0.36, x + s * 0.12, y - s * 0.7, x + s * 0.48, y - s * 0.67);
      g.lineStyle(1.1, 0x957053).lineBetween(x - s * 0.15, y - s * 0.22, x - s * 0.09, y + s * 0.30);
    } else if (stage.mode === "magnet") {
      disk(g, x, y, s * 0.50, 0x82919c);
      disk(g, x, y - 1, s * 0.35, 0xbcc9cf);
      g.lineStyle(2, ink).lineBetween(x - 3, y, x + 3, y);
    } else {
      box(g, x - s / 2, y - s / 2, s, s, 3, 0xcc9564, 1.6);
      box(g, x - s * 0.38, y - s * 0.38, s * 0.76, s * 0.76, 1.5, 0xe6b479, 0.9);
      g.lineStyle(2, 0x996c57).lineBetween(x - s * 0.3, y - s * 0.3, x + s * 0.3, y + s * 0.3)
        .lineBetween(x - s * 0.3, y + s * 0.3, x + s * 0.3, y - s * 0.3);
    }
  }
  board.actors.forEach((cell, seat) => {
    if (cell < 0 || rows[Math.floor(cell / columns)]?.[cell % columns] === "?") return;
    const { x, y } = center(cell);
    const overlap = board.actors[0] === board.actors[1];
    pawn(g, x + (overlap ? (seat ? 1 : -1) * tile * 0.18 : 0), y, tile * (overlap ? 0.76 : 0.88), seat, time);
  });

  if (sequence) {
    const count = stage.code?.length ?? 4;
    const spacing = Math.min(18, (w - 70) / count);
    const y = top - 22;
    box(g, 400 - count * spacing / 2 - 8, y - 8, count * spacing + 16, 16, 7, ink);
    for (let i = 0; i < count; i++) {
      const x = 400 + (i - (count - 1) / 2) * spacing;
      const symbol = board.code[i];
      const revealed = symbol >= 0 && symbol <= 3;
      disk(g, x, y, 5.5, i < board.step ? mint : revealed ? glyphColors[symbol] : 0x777186, 0);
      if (i < board.step) g.lineStyle(1.4, ink).beginPath().moveTo(x - 2.5, y).lineTo(x - 0.7, y + 2).lineTo(x + 2.6, y - 2).strokePath();
      else if (revealed) glyph(g, x, y, symbol, 3.7);
    }
    const label = board.sent >= 0 ? stage.labels?.[board.sent] : undefined;
    if (label) word(400, top + h + 16, label, 10);
  }
}
