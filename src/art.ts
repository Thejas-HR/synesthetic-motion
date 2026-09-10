import type p5 from "p5";
import { Dancer } from "./dancer";

// The art layer is the "image" half of the synesthesia: dancer movement leaves
// a lasting mark. It owns a persistent buffer so trails accumulate across
// frames. Multiple styles, switchable live, because the right look is a thing
// you pick by eye, not by spec.

export type ArtMode = "ribbon" | "web" | "bloom" | "off";

const PALETTE: [number, number, number][] = [
  [255, 150, 60], // warm orange
  [255, 90, 200], // magenta
  [70, 200, 255], // cyan
  [130, 240, 150], // green
  [255, 85, 95], // red
  [180, 120, 255], // violet
];

const BG: [number, number, number] = [12, 12, 16];

export class ArtLayer {
  private buf: p5.Graphics | null = null;
  mode: ArtMode = "ribbon";

  private ensure(p: p5) {
    if (!this.buf || this.buf.width !== p.width || this.buf.height !== p.height) {
      this.buf = p.createGraphics(p.width, p.height);
      this.buf.clear();
    }
  }

  clear() {
    this.buf?.clear();
  }

  setMode(m: ArtMode) {
    this.mode = m;
    // Web is recomputed live each frame, so a leftover accumulation would
    // linger. Ribbon and bloom want their history kept.
    if (m === "web" || m === "off") this.clear();
  }

  draw(p: p5, dancers: Dancer[]) {
    if (this.mode === "off") return;
    this.ensure(p);
    const b = this.buf!;

    if (this.mode === "web") {
      b.clear();
      this.drawWeb(b, dancers);
    } else {
      this.fade(b);
      if (this.mode === "ribbon") this.drawRibbon(b, dancers);
      else this.drawBloom(b, dancers);
    }

    p.image(b, 0, 0);
  }

  private fade(b: p5.Graphics) {
    // Gently pull the buffer back toward background so trails decay instead of
    // filling the whole stage to mud. Kept light so color survives a while.
    b.noStroke();
    b.fill(BG[0], BG[1], BG[2], 2);
    b.rect(0, 0, b.width, b.height);
  }

  private drawRibbon(b: p5.Graphics, dancers: Dancer[]) {
    b.strokeCap(b.ROUND);
    dancers.forEach((d, i) => {
      const c = PALETTE[i % PALETTE.length];
      const v = Math.min(d.speed(), 40);
      if (v < 0.4) return;
      const core = 3 + v * 0.14;
      // Wide, faint glow pass under a bright core so the ribbon reads as light
      // rather than a thin grey scratch.
      b.stroke(c[0], c[1], c[2], 45);
      b.strokeWeight(core * 3);
      b.line(d.prev.x, d.prev.y, d.pos.x, d.pos.y);
      b.stroke(c[0], c[1], c[2], 255);
      b.strokeWeight(core);
      b.line(d.prev.x, d.prev.y, d.pos.x, d.pos.y);
    });
  }

  private drawBloom(b: p5.Graphics, dancers: Dancer[]) {
    dancers.forEach((d, i) => {
      const c = PALETTE[i % PALETTE.length];
      if (d.speed() < 0.4) return;
      const midx = (d.prev.x + d.pos.x) / 2;
      b.noFill();
      b.stroke(c[0], c[1], c[2], 150);
      b.strokeWeight(1.5);
      b.bezier(
        d.prev.x, d.prev.y,
        midx, d.prev.y,
        midx, d.pos.y,
        d.pos.x, d.pos.y
      );
      b.noStroke();
      b.fill(c[0], c[1], c[2], 90);
      b.circle(d.pos.x, d.pos.y, 7);
    });
  }

  private drawWeb(b: p5.Graphics, dancers: Dancer[]) {
    const threshold = Math.min(b.width, b.height) * 0.5;
    for (let i = 0; i < dancers.length; i++) {
      for (let j = i + 1; j < dancers.length; j++) {
        const a = dancers[i].pos;
        const c = dancers[j].pos;
        const dist = Math.hypot(a.x - c.x, a.y - c.y);
        if (dist > threshold) continue;
        const alpha = (1 - dist / threshold) * 130;
        const col = PALETTE[(i + j) % PALETTE.length];
        b.stroke(col[0], col[1], col[2], alpha);
        b.strokeWeight(1);
        b.line(a.x, a.y, c.x, c.y);
      }
    }
  }
}
