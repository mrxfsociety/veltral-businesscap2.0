/*
 * Paper Theatre sound, synthesised with Web Audio. No audio files.
 * A paper rustle, a stamp thud, a soft chime at calm, and rain whose volume
 * follows the storm number. Nothing plays until the player has pressed Start
 * (browsers only allow audio after a gesture anyway).
 */

const PREF_KEY = "doover:sound";

export function readSoundPref(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeSoundPref(on: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    // storage unavailable: the choice lasts for this page only
  }
}

/** Rain volume for a storm number: silent below 45, then rising to 0.16. Pure, tested. */
export function rainGain(storm: number): number {
  if (storm < 45) return 0;
  const t = Math.min(1, (storm - 45) / 55);
  return Math.round((0.025 + 0.135 * t) * 1000) / 1000;
}

type Ctx = AudioContext;

class PaperSound {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rain: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private on = false;

  /** Call from a user gesture (the Start button). */
  enable() {
    this.on = true;
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return;
      this.ctx = new AudioCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise(2);
    }
    void this.ctx.resume().catch(() => undefined);
  }

  disable() {
    this.on = false;
    this.setRain(0);
  }

  get enabled() {
    return this.on && this.ctx !== null;
  }

  private makeNoise(seconds: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * seconds,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = white * 0.6 + brown * 2.4;
    }
    return buffer;
  }

  private burst(
    duration: number,
    filter: { type: BiquadFilterType; frequency: number; q?: number },
    peak: number,
  ) {
    if (!this.enabled || !this.noise) return;
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = filter.type;
    band.frequency.value = filter.frequency;
    band.Q.value = filter.q ?? 0.8;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(band).connect(gain).connect(this.master!);
    source.start(now, Math.random() * 1.5);
    source.stop(now + duration + 0.05);
  }

  /** A sheet of paper sliding: filtered noise with a soft swell. */
  rustle() {
    this.burst(0.22, { type: "bandpass", frequency: 3200, q: 0.6 }, 0.16);
    window.setTimeout(
      () =>
        this.burst(0.16, { type: "bandpass", frequency: 2200, q: 0.9 }, 0.1),
      70,
    );
  }

  /** A rubber stamp landing: a low thud with a paper click. */
  stamp() {
    if (!this.enabled) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.42, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain).connect(this.master!);
    osc.start(now);
    osc.stop(now + 0.2);
    this.burst(0.05, { type: "highpass", frequency: 2500 }, 0.12);
  }

  /** Calm: two soft bells, a fifth apart. */
  chime() {
    if (!this.enabled) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    [659.25, 987.77].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
      osc.connect(gain).connect(this.master!);
      osc.start(start);
      osc.stop(start + 1.7);
    });
  }

  /** Rain follows the storm number. */
  setRain(storm: number) {
    const target = this.on ? rainGain(storm) : 0;
    if (!this.ctx || !this.noise) return;
    const ctx = this.ctx;
    if (!this.rain && target > 0) {
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      source.loop = true;
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 900;
      const low = ctx.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 7000;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(high).connect(low).connect(gain).connect(this.master!);
      source.start();
      this.rain = { source, gain };
    }
    this.rain?.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.6);
  }

  /** Leave the theatre: fade the rain out. */
  stop() {
    this.setRain(0);
  }
}

let shared: PaperSound | null = null;

export function paperSound(): PaperSound {
  shared ??= new PaperSound();
  return shared;
}
