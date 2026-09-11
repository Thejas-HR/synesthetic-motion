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

---

## Chapter 4 — Phase 2: the art and the sound

This is the half that makes it synesthetic rather than a diagram.

**Sound (`audio.ts`, Tone.js).** The original ran one raw sine oscillator per
dancer, droning continuously, y to pitch and x to amplitude — muddy and
tuneless. Replaced with a triangle PolySynth into a reverb, and every formation
is played as a short **arpeggio on a C-major pentatonic** scale: dancers sound
left-to-right by x, and height sets pitch. Pentatonic means no combination of
positions lands on a dissonant interval, so any shape sounds consonant. Sound is
behind an explicit toggle to satisfy browser autoplay policy (Tone.start on a
click).

**Art (`art.ts`).** A persistent p5.Graphics buffer so movement leaves a lasting
mark, with three switchable styles because the right look is chosen by eye:

- **Ribbon** — glowing colored trails (a wide faint glow pass under a bright
  core, so a thin line reads as light rather than a grey scratch).
- **Bloom** — bezier arcs with dotted nodes tracing each dancer's path.
- **Web** — a live constellation, lines between dancers within range, denser as
  they cluster.

**A real debugging note for the case study.** Trails first rendered grey, not
colored. Chased it through alpha, blend mode, and fade strength; an additive
blend actually made it worse by saturating overlapping pixels to white. A solid
colored square drawn on the buffer proved the color pipeline was fine all along
— the cause was thin, semi-transparent lines anti-aliasing against black and
losing their saturation, made worse by the per-frame fade. Fix was full-opacity
color plus the glow underlay, with the fade kept light. Lesson: isolate the
variable (draw a solid shape) before tuning ten parameters blind.

---

## Chapter 5 — The reset: it looked nicer and did less

After Phase 2, the honest reaction: it felt *cheaper* than the original, and
still useless. Both were fair, and worth recording because this is the real turn
of the project.

**Why it felt like less.** Phase 1 chased "beyond 20 formations" and in doing so
dropped the original's actual spine: record → timeline → play back a sequence.
What was left was a prettier sandbox with no timeline and nothing you could keep.
More capability, less product. Prettier trails do not make up for having removed
the one structure that made it a tool.

**Why it felt useless.** Phases 1–2 built *capabilities* (generators, art,
sound) and mistook them for a product. There was no flow: you land, you fiddle,
you leave with nothing. Nobody has a reason to arrive and nobody leaves with
anything. A pile of features is not a reason to use something. The mistake was
picking an *identity* (tool + art) without ever designing the *job-to-be-done*:
who arrives, what they're making, what they walk away with.

**The decision (job-to-be-done).** This is a **formation planner for a routine**.

- User: a dance teacher / choreographer planning a piece.
- Job: map where everyone stands through the whole routine.
- Leaves with: a formation map + shareable playback link the dancers rehearse
  from. The *output* is the value.

**The flow.** Start a Piece (name, cast) → build a timed sequence of formations
(generators + drag to place, add each to a timeline) → set transition timings /
reorder → preview the routine playing through → export a formation map / link /
video.

**The reframe that makes the art useful.** In preview, trails are not decoration
— they are the **movement paths**, colour-coded per dancer: who travels where
between formations, where paths cross, where spacing tightens. Still beautiful,
now it's information. Sound becomes an optional review layer, not the point.

**Consequence for the build.** The engine modules (formations, dancer, art,
audio) survive, but the app is restructured around a **Piece + timeline** as the
backbone, with export as the payoff. Visual becomes a real design pass (a
considered planning surface / marked stage, named dancer tokens, an editor-style
timeline — not a black void with neon), shown as directions to choose from.

**Status: paused here.** Flow agreed (choreographer plan, formation-map output,
art-as-paths). Next session starts by rebuilding around the Piece + timeline
before any polish. Nothing built for this chapter yet — this is the plan.
