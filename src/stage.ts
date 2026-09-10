import p5 from "p5";
import { Dancer } from "./dancer";
import type { Stage, Vec2 } from "./formations";

const DANCER_SIZE = 26;
const MARGIN = 60;

export class StageSketch {
  p!: p5;
  dancers: Dancer[] = [];
  stage: Stage = { x: 0, y: 0, w: 0, h: 0 };
  private dragging = -1;
  onDragEnd: (() => void) | null = null;
  onReady: (() => void) | null = null;

  constructor(container: HTMLElement) {
    new p5((p: p5) => {
      this.p = p;

      p.setup = () => {
        const c = p.createCanvas(container.clientWidth, container.clientHeight);
        c.parent(container);
        this.recomputeStage();
        if (this.onReady) this.onReady();
      };

      p.windowResized = () => {
        p.resizeCanvas(container.clientWidth, container.clientHeight);
        this.recomputeStage();
      };

      p.draw = () => this.render();
      p.mousePressed = () => this.pressed();
      p.mouseDragged = () => this.dragged();
      p.mouseReleased = () => this.released();
    });
  }

  private recomputeStage() {
    this.stage = {
      x: MARGIN,
      y: MARGIN,
      w: this.p.width - MARGIN * 2,
      h: this.p.height - MARGIN * 2,
    };
  }

  setDancers(d: Dancer[]) {
    this.dancers = d;
  }

  private render() {
    const p = this.p;
    p.background(12, 12, 16);

    // Stage frame
    p.noFill();
    p.stroke(60, 60, 72);
    p.strokeWeight(1);
    p.rect(this.stage.x, this.stage.y, this.stage.w, this.stage.h);

    // Center cross
    const cx = this.stage.x + this.stage.w / 2;
    const cy = this.stage.y + this.stage.h / 2;
    p.stroke(40, 40, 50);
    p.line(cx - 14, cy, cx + 14, cy);
    p.line(cx, cy - 14, cx, cy + 14);

    // Audience label
    p.noStroke();
    p.fill(90, 200, 120);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text("AUDIENCE", cx, this.stage.y - 24);

    for (let i = 0; i < this.dancers.length; i++) {
      const d = this.dancers[i];
      d.update();
      const hot = i === this.dragging;
      p.noStroke();
      p.fill(hot ? p.color(255, 210, 120) : p.color(250, 175, 255, 220));
      p.circle(d.pos.x, d.pos.y, DANCER_SIZE);
      p.fill(210);
      p.textSize(11);
      p.text(d.name, d.pos.x, d.pos.y + DANCER_SIZE);
    }
  }

  private hit(m: Vec2): number {
    for (let i = this.dancers.length - 1; i >= 0; i--) {
      const d = this.dancers[i];
      if (Math.hypot(d.pos.x - m.x, d.pos.y - m.y) <= DANCER_SIZE) return i;
    }
    return -1;
  }

  private pressed() {
    this.dragging = this.hit({ x: this.p.mouseX, y: this.p.mouseY });
  }

  private dragged() {
    if (this.dragging === -1) return;
    this.dancers[this.dragging].moveTo({ x: this.p.mouseX, y: this.p.mouseY });
  }

  private released() {
    if (this.dragging !== -1 && this.onDragEnd) this.onDragEnd();
    this.dragging = -1;
  }
}
