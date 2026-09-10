import type { Vec2 } from "./formations";

const TRANSITION_SPEED = 0.09;

export class Dancer {
  pos: Vec2;
  prev: Vec2; // position last frame, so the art layer can draw motion
  target: Vec2;
  name: string;

  constructor(start: Vec2, name: string) {
    this.pos = { ...start };
    this.prev = { ...start };
    this.target = { ...start };
    this.name = name;
  }

  setTarget(t: Vec2) {
    this.target = { ...t };
  }

  /** Snap instantly, e.g. while the user is dragging. */
  moveTo(p: Vec2) {
    this.prev = { ...this.pos };
    this.pos = { ...p };
    this.target = { ...p };
  }

  update() {
    this.prev = { ...this.pos };
    this.pos.x += (this.target.x - this.pos.x) * TRANSITION_SPEED;
    this.pos.y += (this.target.y - this.pos.y) * TRANSITION_SPEED;
  }

  /** Distance moved this frame, for velocity-driven art and sound. */
  speed(): number {
    return Math.hypot(this.pos.x - this.prev.x, this.pos.y - this.prev.y);
  }
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Assign target positions to dancers by nearest match so bodies don't swap
 * across the stage on a transition. Kept from the original Processing tool;
 * it's the one piece of genuinely thoughtful logic in there.
 */
export function assignNearest(dancers: Dancer[], targets: Vec2[]) {
  const taken = new Array(targets.length).fill(false);
  for (const dancer of dancers) {
    let best = -1;
    let min = Infinity;
    for (let i = 0; i < targets.length; i++) {
      if (taken[i]) continue;
      const d = dist(dancer.pos, targets[i]);
      if (d < min) {
        min = d;
        best = i;
      }
    }
    if (best !== -1) {
      dancer.setTarget(targets[best]);
      taken[best] = true;
    }
  }
}
