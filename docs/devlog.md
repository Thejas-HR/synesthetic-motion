# Synesthetic Motion — Devlog

Running record of decisions and reasoning, so the case study can be written from
what actually happened rather than reconstructed after the fact.

---

## Chapter 1 — Where it came from, and the fork

**Origin.** This started as a Processing (Java) class project: a dance-formation
tool. You set a number of dancers, named them, and stepped them through 20
preset formations (line, circle, V, diamond, spiral, and so on). Recording
captured a sequence, playback replayed it, and on top of playback the tool drew
accumulating abstract line art and generated sound (one sine oscillator per
dancer, y-position to pitch, x-position to amplitude).

**The wall.** It's a desktop Java app with native sound libraries and blocking
Swing dialogs. It cannot be hosted. A faithful hand-port to p5.js proved the
concept runs in a browser, but a straight port would carry all the original's
problems forward.

**The three identities.** Before rebuilding, we named what this could actually
be:

1. A real choreography **tool** (needs open authoring, not just presets).
2. A generative **art / experience** (movement becomes image and sound; value is
   aesthetic, not utility).
3. A live **installation / performance** system (real bodies tracked by camera
   drive visuals and score in real time — the TouchDesigner / Max world).

**The decision.** Fuse #1 and #2: a tool that is also an experience, fully in
the browser. #3 is the north star for "if the facilities exist," not this build.
Nothing from the original is abandoned; every piece (formations, recording,
timeline, art, sound) gets rebuilt properly instead of ported cheaply.

**Why not the tool-only path.** As desk software for choreographers it isn't
competitive and has no users lined up. The part that actually moves people is
the synesthesia. Judging the art and sound by "is it useful to a planner" was
the wrong ruler; in an experience, usefulness isn't the test.

---

## Chapter 2 — Beyond 20 formations

The real limitation of the original was never the number 20. It was treating a
formation as a **named, hardcoded shape**. The reframe:

> A formation is a distribution of N points on the stage.

Once that's true, "more formations" becomes "more ways to generate a point
distribution," and there are many:

- **Parametric generators** — expose the knobs (spread, rotation, skew, density)
  that the presets hardcoded. One "circle" becomes infinite circles. Cheap, and
  it reuses the original's math.
- **Composition** — split dancers into groups, one shape per group.
- **Math beyond geometry** — spirals, phyllotaxis, noise fields, flocking. This
  is what stops it looking like a geometry class.
- **Text-to-formation (AI)** — describe a formation in words, a model tunes a
  generator or returns positions. The headline, novel feature. Deferred to a
  later phase so it doesn't slow the core.
- **Draw a path** — sketch a shape, dancers distribute along it.

**Product shape:** three ways to make a formation — *describe it*, *shape it*,
*place it* — all feeding one art-and-sound engine. Presets survive only as
starting points inside those modes.

**Build order:** Phase 1 engine + authoring (parametric + drag + save + morph),
Phase 2 art + sound done properly, Phase 3 text-to-AI and draw-a-path.

---

## Chapter 3 — Phase 1 scaffold

Stack: Vite + TypeScript, p5.js for visuals, Tone.js for sound (added in Phase
2). Standalone repo and deploy, not part of the portfolio.

Module split, deliberately separating what the original tangled into one 945-line
file:

- `formations.ts` — pure parametric generators. Point math only, no drawing, no
  state.
- `dancer.ts` — the bodies: lerp morph, and `assignNearest` (nearest-target
  matching kept from the original so dancers don't swap across the stage).
- `stage.ts` — the p5 render + drag layer.
- `main.ts` — UI and state wiring.

Phase 1 milestone: a stage where you pick a generator, turn the knobs, drag any
dancer to author your own arrangement, save it, and morph between saved
formations. Naming is deferred, not a gate — the original's blocking name
dialogs were its worst UX.
