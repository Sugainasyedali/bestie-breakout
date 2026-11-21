"use client";

type Track = {
  bpm: number;
  lead: OscillatorType;
  melody: readonly number[];
  bass: readonly number[];
  sustain: number;
};

const rest = 0;
// Six original two-bar phrases. Each column is an eighth note.
const tracks: readonly Track[] = [
  {
    bpm: 104,
    lead: "triangle",
    melody: [
      74,
      rest,
      78,
      81,
      rest,
      78,
      76,
      rest,
      71,
      74,
      rest,
      76,
      78,
      74,
      69,
      rest,
    ],
    bass: [50, 57, 47, 45],
    sustain: 0.74,
  },
  {
    bpm: 122,
    lead: "square",
    melody: [
      72,
      rest,
      67,
      70,
      rest,
      72,
      75,
      rest,
      74,
      70,
      rest,
      67,
      65,
      rest,
      67,
      70,
    ],
    bass: [48, 55, 46, 53],
    sustain: 0.33,
  },
  {
    bpm: 76,
    lead: "sine",
    melody: [
      76,
      rest,
      rest,
      79,
      83,
      rest,
      81,
      rest,
      74,
      rest,
      78,
      rest,
      79,
      rest,
      71,
      rest,
    ],
    bass: [52, 55, 50, 47],
    sustain: 1.4,
  },
  {
    bpm: 128,
    lead: "square",
    melody: [
      73,
      76,
      rest,
      80,
      83,
      rest,
      80,
      rest,
      71,
      75,
      78,
      rest,
      80,
      76,
      rest,
      75,
    ],
    bass: [49, 56, 47, 51],
    sustain: 0.47,
  },
  {
    bpm: 92,
    lead: "sine",
    melody: [
      79,
      83,
      rest,
      86,
      rest,
      81,
      78,
      rest,
      76,
      rest,
      79,
      83,
      81,
      rest,
      74,
      rest,
    ],
    bass: [55, 50, 52, 50],
    sustain: 1.15,
  },
  {
    bpm: 116,
    lead: "triangle",
    melody: [
      77,
      rest,
      81,
      79,
      rest,
      77,
      72,
      74,
      76,
      rest,
      79,
      76,
      72,
      rest,
      74,
      76,
    ],
    bass: [53, 48, 52, 55],
    sustain: 0.52,
  },
];

type Note = [
  delay: number,
  hz: number,
  endHz: number,
  duration: number,
  shape: OscillatorType,
  level: number,
];
const cues: Record<string, Note[]> = {
  step: [[0, 116, 62, 0.045, "triangle", 0.08]],
  jump: [[0, 245, 640, 0.16, "triangle", 0.18]],
  land: [
    [0, 178, 55, 0.095, "sine", 0.23],
    [0.02, 260, 110, 0.045, "triangle", 0.08],
  ],
  switch: [
    [0, 612, 315, 0.055, "square", 0.055],
    [0.04, 440, 660, 0.095, "triangle", 0.12],
  ],
  door: [
    [0, 78, 145, 0.26, "sawtooth", 0.065],
    [0.22, 392, 523, 0.12, "triangle", 0.15],
  ],
  collect: [
    [0, 784, 784, 0.08, "sine", 0.19],
    [0.075, 1175, 1568, 0.18, "sine", 0.17],
  ],
  correct: [
    [0, 523, 523, 0.11, "triangle", 0.17],
    [0.09, 659, 659, 0.12, "triangle", 0.16],
    [0.18, 784, 784, 0.16, "sine", 0.18],
  ],
  fail: [
    [0, 293, 244, 0.11, "square", 0.055],
    [0.11, 233, 105, 0.22, "triangle", 0.2],
  ],
  emote: [
    [0, 480, 690, 0.08, "sine", 0.19],
    [0.075, 840, 585, 0.11, "triangle", 0.15],
  ],
  start: [
    [0, 392, 392, 0.11, "triangle", 0.17],
    [0.12, 523, 523, 0.12, "triangle", 0.16],
    [0.24, 698, 784, 0.24, "sine", 0.18],
  ],
  complete: [
    [0, 440, 440, 0.11, "triangle", 0.16],
    [0.12, 554, 554, 0.14, "triangle", 0.17],
    [0.23, 659, 659, 0.3, "sine", 0.17],
  ],
  victory: [
    [0, 523, 523, 0.1, "triangle", 0.16],
    [0.1, 659, 659, 0.1, "triangle", 0.16],
    [0.2, 784, 784, 0.13, "triangle", 0.16],
    [0.34, 1047, 1047, 0.4, "sine", 0.19],
    [0.34, 659, 659, 0.37, "triangle", 0.1],
  ],
  click: [[0, 584, 430, 0.048, "triangle", 0.115]],
};

class ArcadeAudio {
  private context: AudioContext | null = null;
  private master?: GainNode;
  private musicBus?: GainNode;
  private effectsBus?: GainNode;
  private music = false;
  private effects = false;
  private volume = 0.65;
  private mission: number | null = null;
  private paused = false;
  private timer?: ReturnType<typeof setInterval>;
  private beat = 0;
  private nextBeat = 0;

  unlock() {
    if (typeof window === "undefined" || !window.AudioContext) return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.effectsBus = this.context.createGain();
      this.effectsBus.gain.value = Number(this.effects);
      this.effectsBus.connect(this.master);
      this.musicBus = this.context.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
    }
    if (this.context.state === "running") this.syncMusic();
    else
      void this.context
        .resume()
        .then(() => this.syncMusic())
        .catch(() => {});
  }

  setMusic(enabled: boolean) {
    this.music = enabled;
    this.syncMusic();
  }

  setEffects(enabled: boolean) {
    this.effects = enabled;
    this.fade(this.effectsBus, Number(enabled));
  }

  setVolume(n: number) {
    if (!Number.isFinite(n)) return;
    this.volume = Math.min(1, Math.max(0, n));
    this.fade(this.master, this.volume);
  }

  scene(mission: number | null, paused: boolean) {
    if (this.mission === mission && this.paused === paused) return;
    if (mission !== this.mission) {
      this.stopMusic();
      this.beat = 0;
    }
    this.mission = mission;
    this.paused = paused;
    this.syncMusic();
  }

  cue(name: string) {
    const ctx = this.context;
    if (
      !this.effects ||
      !ctx ||
      ctx.state !== "running" ||
      !this.effectsBus ||
      !Object.hasOwn(cues, name)
    )
      return;
    for (const [delay, hz, endHz, length, wave, level] of cues[name]) {
      this.note(
        this.effectsBus,
        ctx.currentTime + delay,
        hz,
        endHz,
        length,
        wave,
        level,
      );
    }
  }

  private fade(bus: GainNode | undefined, level: number) {
    if (bus && this.context)
      bus.gain.setTargetAtTime(level, this.context.currentTime, 0.012);
  }

  private note(
    bus: GainNode,
    at: number,
    hz: number,
    endHz: number,
    length: number,
    wave: OscillatorType,
    level: number,
  ) {
    const ctx = this.context!;
    const voice = ctx.createOscillator();
    const envelope = ctx.createGain();
    voice.type = wave;
    voice.frequency.setValueAtTime(hz, at);
    if (hz !== endHz)
      voice.frequency.exponentialRampToValueAtTime(endHz, at + length);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.linearRampToValueAtTime(level, at + 0.009);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    voice.connect(envelope).connect(bus);
    voice.onended = () => {
      voice.disconnect();
      envelope.disconnect();
    };
    voice.start(at);
    voice.stop(at + length + 0.01);
  }

  private stopMusic() {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
    this.fade(this.musicBus, 0);
  }

  private syncMusic() {
    const ctx = this.context;
    const track = this.mission === null ? undefined : tracks[this.mission];
    if (
      !ctx ||
      !track ||
      !this.music ||
      this.paused ||
      ctx.state !== "running" ||
      !this.musicBus
    ) {
      if (this.timer !== undefined) this.stopMusic();
      return;
    }
    if (this.timer !== undefined) return;
    this.fade(this.musicBus, 0.64);
    const bus = this.musicBus;
    this.nextBeat = ctx.currentTime + 0.025;
    const seconds = 30 / track.bpm;
    const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
    const schedule = () => {
      // Skip unsounded elapsed time when a background tab wakes up.
      this.nextBeat = Math.max(this.nextBeat, ctx.currentTime);
      while (this.nextBeat < ctx.currentTime + 0.13) {
        const step = this.beat % track.melody.length;
        const pitch = track.melody[step];
        if (pitch)
          this.note(
            bus,
            this.nextBeat,
            hz(pitch),
            hz(pitch),
            seconds * track.sustain,
            track.lead,
            track.lead === "square" ? 0.04 : 0.095,
          );
        if (step % 4 === 0) {
          const bass = hz(track.bass[step / 4]);
          this.note(
            bus,
            this.nextBeat,
            bass,
            bass,
            seconds * 2.6,
            "sine",
            0.13,
          );
        }
        this.beat++;
        this.nextBeat += seconds;
      }
    };
    schedule();
    this.timer = setInterval(schedule, 60);
  }
}

export const arcadeAudio = new ArcadeAudio();
