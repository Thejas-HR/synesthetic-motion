import "./style.css";
import { StageSketch } from "./stage";
import { Dancer, assignNearest } from "./dancer";
import { AudioEngine } from "./audio";
import type { ArtMode } from "./art";
import {
  generatorList,
  generators,
  defaultParams,
  type FormationParams,
  type GeneratorId,
  type Vec2,
} from "./formations";

interface SavedFormation {
  name: string;
  positions: Vec2[];
}

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="stage-wrap" id="stage"></div>
  <aside class="panel">
    <header>
      <h1>Synesthetic Motion</h1>
      <p class="sub">Phase 1 · author &amp; morph formations</p>
    </header>

    <section>
      <label class="row">Dancers <span id="count-val">6</span>
        <input id="count" type="range" min="1" max="24" value="6" />
      </label>
    </section>

    <section>
      <h2>Generators</h2>
      <div class="gen-grid" id="gens"></div>
    </section>

    <section>
      <h2>Knobs</h2>
      <label class="row">Spread <input id="spread" type="range" min="0.1" max="1" step="0.01" value="0.7" /></label>
      <label class="row">Rotation <input id="rotation" type="range" min="0" max="6.28" step="0.01" value="0" /></label>
      <label class="row">Skew <input id="skew" type="range" min="0" max="1" step="0.01" value="0" /></label>
    </section>

    <section>
      <h2>Art</h2>
      <div class="gen-grid" id="art-modes"></div>
      <button id="clear-art" class="ghost">Clear canvas</button>
    </section>

    <section>
      <h2>Sound</h2>
      <button id="sound" class="toggle">Sound off</button>
    </section>

    <section>
      <button id="save" class="primary">Save current formation</button>
      <div class="saved" id="saved"></div>
    </section>

    <footer>Drag any dancer to author your own. Save it, then morph between them.</footer>
  </aside>
`;

const params: FormationParams = { ...defaultParams };
let count = 6;
let dancers: Dancer[] = [];
const saved: SavedFormation[] = [];
let activeGen: GeneratorId = "circle";

const sketch = new StageSketch(document.getElementById("stage")!);
const audio = new AudioEngine();

function rebuildDancers() {
  const next: Dancer[] = [];
  for (let i = 0; i < count; i++) {
    if (i < dancers.length) {
      next.push(dancers[i]);
    } else {
      const c = sketch.stage;
      next.push(
        new Dancer(
          { x: c.x + Math.random() * c.w, y: c.y + Math.random() * c.h },
          `D${i + 1}`
        )
      );
    }
  }
  dancers = next;
  sketch.setDancers(dancers);
}

function applyGenerator(id: GeneratorId) {
  activeGen = id;
  const targets = generators[id].generate(count, sketch.stage, params);
  assignNearest(dancers, targets);
  audio.playFormation(dancers, sketch.stage);
  markActiveGen();
}

function saveCurrent() {
  const positions = dancers.map((d) => ({ ...d.target }));
  saved.push({ name: `Formation ${saved.length + 1}`, positions });
  renderSaved();
}

function applySaved(i: number) {
  const f = saved[i];
  if (f.positions.length !== dancers.length) rebuildToCount(f.positions.length);
  assignNearest(dancers, f.positions);
  audio.playFormation(dancers, sketch.stage);
}

function rebuildToCount(n: number) {
  count = n;
  (document.getElementById("count") as HTMLInputElement).value = String(n);
  document.getElementById("count-val")!.textContent = String(n);
  rebuildDancers();
}

// ---- UI wiring ----

const gensEl = document.getElementById("gens")!;
for (const g of generatorList) {
  const b = document.createElement("button");
  b.textContent = g.label;
  b.dataset.id = g.id;
  b.onclick = () => applyGenerator(g.id);
  gensEl.appendChild(b);
}
function markActiveGen() {
  gensEl.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", (b as HTMLElement).dataset.id === activeGen);
  });
}

function renderSaved() {
  const el = document.getElementById("saved")!;
  el.innerHTML = "";
  saved.forEach((f, i) => {
    const b = document.createElement("button");
    b.textContent = f.name;
    b.onclick = () => applySaved(i);
    el.appendChild(b);
  });
}

const countEl = document.getElementById("count") as HTMLInputElement;
countEl.oninput = () => {
  count = Number(countEl.value);
  document.getElementById("count-val")!.textContent = String(count);
  rebuildDancers();
  applyGenerator(activeGen);
};

for (const key of ["spread", "rotation", "skew"] as const) {
  const el = document.getElementById(key) as HTMLInputElement;
  el.oninput = () => {
    params[key] = Number(el.value);
    applyGenerator(activeGen);
  };
}

// Art mode buttons
const artModes: { id: ArtMode; label: string }[] = [
  { id: "ribbon", label: "Ribbon" },
  { id: "web", label: "Web" },
  { id: "bloom", label: "Bloom" },
  { id: "off", label: "Off" },
];
const artEl = document.getElementById("art-modes")!;
for (const m of artModes) {
  const b = document.createElement("button");
  b.textContent = m.label;
  b.dataset.mode = m.id;
  b.onclick = () => {
    sketch.art.setMode(m.id);
    artEl.querySelectorAll("button").forEach((x) =>
      x.classList.toggle("active", (x as HTMLElement).dataset.mode === m.id)
    );
  };
  artEl.appendChild(b);
}
artEl.querySelector('[data-mode="ribbon"]')!.classList.add("active");

document.getElementById("clear-art")!.onclick = () => sketch.art.clear();

const soundBtn = document.getElementById("sound") as HTMLButtonElement;
soundBtn.onclick = async () => {
  if (audio.enabled) {
    audio.disable();
    soundBtn.textContent = "Sound off";
    soundBtn.classList.remove("active");
  } else {
    await audio.enable();
    soundBtn.textContent = "Sound on";
    soundBtn.classList.add("active");
    audio.playFormation(dancers, sketch.stage);
  }
};

document.getElementById("save")!.onclick = saveCurrent;

// Dragging a dancer means the user is authoring; nothing to recompute, but the
// hook is here for when art/sound start reacting to authored positions.
sketch.onDragEnd = () => {};

// Boot once p5 has measured the stage, so the first formation isn't built
// around a zero-size stage.
sketch.onReady = () => {
  rebuildDancers();
  applyGenerator("circle");
};
