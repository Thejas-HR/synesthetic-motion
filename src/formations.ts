// A formation is not a named shape. It is a distribution of N points on the
// stage. Everything here is a *generator*: give it a count, a stage, and a set
// of knobs, and it returns positions. Exposing the knobs is what turns a
// handful of families into an infinite space of formations.

export interface Vec2 {
  x: number;
  y: number;
}

export interface Stage {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function stageCenter(s: Stage): Vec2 {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

/** Shared knobs. Not every generator uses every knob; that's fine. */
export interface FormationParams {
  spread: number; // 0..1, how much of the stage the formation fills
  rotation: number; // radians
  skew: number; // 0..1, asymmetry / lean
}

export const defaultParams: FormationParams = {
  spread: 0.7,
  rotation: 0,
  skew: 0,
};

export type GeneratorId =
  | "line"
  | "circle"
  | "grid"
  | "v"
  | "spiral"
  | "scatter";

export interface Generator {
  id: GeneratorId;
  label: string;
  generate: (count: number, stage: Stage, p: FormationParams) => Vec2[];
}

function rotateAround(pt: Vec2, center: Vec2, angle: number): Vec2 {
  const dx = pt.x - center.x;
  const dy = pt.y - center.y;
  return {
    x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}

export const generators: Record<GeneratorId, Generator> = {
  line: {
    id: "line",
    label: "Line",
    generate(count, stage, p) {
      const c = stageCenter(stage);
      const half = (stage.w * p.spread) / 2;
      const out: Vec2[] = [];
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const x = c.x - half + t * half * 2;
        const y = c.y + (t - 0.5) * stage.h * p.skew;
        out.push(rotateAround({ x, y }, c, p.rotation));
      }
      return out;
    },
  },

  circle: {
    id: "circle",
    label: "Circle",
    generate(count, stage, p) {
      const c = stageCenter(stage);
      const r = (Math.min(stage.w, stage.h) / 2) * p.spread;
      const out: Vec2[] = [];
      for (let i = 0; i < count; i++) {
        const a = p.rotation + (Math.PI * 2 * i) / count;
        out.push({
          x: c.x + Math.cos(a) * r * (1 + p.skew),
          y: c.y + Math.sin(a) * r,
        });
      }
      return out;
    },
  },

  grid: {
    id: "grid",
    label: "Grid",
    generate(count, stage, p) {
      const c = stageCenter(stage);
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const w = stage.w * p.spread;
      const h = stage.h * p.spread;
      const out: Vec2[] = [];
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const tx = cols === 1 ? 0.5 : col / (cols - 1);
        const ty = rows === 1 ? 0.5 : row / (rows - 1);
        const x = c.x - w / 2 + tx * w;
        const y = c.y - h / 2 + ty * h;
        out.push(rotateAround({ x, y }, c, p.rotation));
      }
      return out;
    },
  },

  v: {
    id: "v",
    label: "V-Shape",
    generate(count, stage, p) {
      const c = stageCenter(stage);
      const armW = (stage.w * p.spread) / 2;
      const armH = (stage.h * p.spread) / 2;
      const half = Math.ceil(count / 2);
      const out: Vec2[] = [];
      for (let i = 0; i < count; i++) {
        const onLeft = i < half;
        const arm = onLeft ? half : count - half;
        const t = arm <= 1 ? 0 : (onLeft ? i : i - half) / (arm - 1);
        const dir = onLeft ? -1 : 1;
        const x = c.x + dir * armW * t;
        const y = c.y - armH + armH * 2 * t;
        out.push(rotateAround({ x, y }, c, p.rotation));
      }
      return out;
    },
  },

  spiral: {
    id: "spiral",
    label: "Spiral",
    generate(count, stage, p) {
      const c = stageCenter(stage);
      const maxR = (Math.min(stage.w, stage.h) / 2) * p.spread;
      const turns = 1.5 + p.skew * 3;
      const out: Vec2[] = [];
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        const a = p.rotation + t * Math.PI * 2 * turns;
        const r = maxR * t;
        out.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
      }
      return out;
    },
  },

  scatter: {
    id: "scatter",
    label: "Scatter",
    generate(count, stage, p) {
      // Seeded-ish scatter that respects spread. Random but bounded.
      const out: Vec2[] = [];
      const pad = (1 - p.spread) * 0.5;
      for (let i = 0; i < count; i++) {
        out.push({
          x: stage.x + (pad + Math.random() * (1 - pad * 2)) * stage.w,
          y: stage.y + (pad + Math.random() * (1 - pad * 2)) * stage.h,
        });
      }
      return out;
    },
  },
};

export const generatorList = Object.values(generators);
