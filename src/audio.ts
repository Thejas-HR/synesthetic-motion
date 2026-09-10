import * as Tone from "tone";
import { Dancer } from "./dancer";
import type { Stage } from "./formations";

// The "sound" half of the synesthesia. The original mapped y to pitch and x to
// amplitude on raw sine oscillators that droned continuously — muddy and
// tuneless. Here every formation is played as an arpeggio on a pentatonic
// scale, so a shape has a voice and it never lands on a dissonant note.

// C major pentatonic across three octaves. No semitone clashes, so any set of
// positions sounds consonant.
const SCALE = [
  "C3", "D3", "E3", "G3", "A3",
  "C4", "D4", "E4", "G4", "A4",
  "C5", "D5", "E5", "G5", "A5",
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export class AudioEngine {
  private synth: Tone.PolySynth;
  private reverb: Tone.Reverb;
  ready = false;
  enabled = false;

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.32 }).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.008, decay: 0.3, sustain: 0.08, release: 1.6 },
    }).connect(this.reverb);
    this.synth.volume.value = -9;
  }

  /** Must be called from a user gesture to satisfy browser autoplay policy. */
  async enable() {
    if (!this.ready) {
      await Tone.start();
      this.ready = true;
    }
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.synth.releaseAll();
  }

  /** Play the shape: dancers sound left-to-right, height sets pitch. */
  playFormation(dancers: Dancer[], stage: Stage) {
    if (!this.enabled || !this.ready || dancers.length === 0) return;
    const ordered = [...dancers].sort((a, b) => a.target.x - b.target.x);
    const now = Tone.now();
    const step = 0.085;
    ordered.forEach((d, i) => {
      const t = 1 - clamp((d.target.y - stage.y) / stage.h, 0, 1); // top = high
      const idx = Math.round(t * (SCALE.length - 1));
      this.synth.triggerAttackRelease(SCALE[idx], "8n", now + i * step, 0.7);
    });
  }
}
