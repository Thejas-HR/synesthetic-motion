# Synesthetic Motion

A browser-based dance-formation studio where movement becomes image and sound.
Author formations three ways — describe them, shape them, or place them by hand —
and the tool turns the choreography into generative art and a live score.

A ground-up rebuild of an earlier Processing project, reframed around one idea: a
formation is not a fixed shape, it's a distribution of points, so the space of
formations is infinite rather than a list of 20.

## Status

Phase 1 — engine and authoring (parametric generators, drag-to-author, save,
morph). Art, sound, and text-to-formation AI land in later phases. See
[`docs/devlog.md`](docs/devlog.md) for the full reasoning trail.

## Run

```bash
npm install
npm run dev
```

## Stack

Vite · TypeScript · p5.js · Tone.js
