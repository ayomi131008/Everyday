import { GameSettings } from '../core/Types';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;

  private isMuted: boolean = false;
  private isIndoors: boolean = false;
  private musicIntervalId: number | null = null;
  private ambienceNode: AudioNode | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlock();
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('touchend', unlockHandler);
        window.removeEventListener('click', unlockHandler);
      };
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('touchend', unlockHandler, { passive: true });
      window.addEventListener('click', unlockHandler, { passive: true });
    }
  }

  unlock(): void {
    if (this.isUnlocked && this.ctx && this.ctx.state === 'running') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        this.ctx = new AudioCtx();

        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // Lowpass filter for interior acoustic dampening
        this.lowpassFilter = this.ctx.createBiquadFilter();
        this.lowpassFilter.type = 'lowpass';
        this.lowpassFilter.frequency.value = 18000; // wide open initially

        this.lowpassFilter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        // Music bus
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.lowpassFilter);

        // SFX bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.8;
        this.sfxGain.connect(this.lowpassFilter);

        // Ambience bus
        this.ambienceGain = this.ctx.createGain();
        this.ambienceGain.gain.value = 0.45;
        this.ambienceGain.connect(this.masterGain); // Ambience goes direct or filtered

        this.startProceduralAmbience();
        this.startProceduralMusic();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isUnlocked = true;
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  applySettings(settings: GameSettings): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setValueAtTime(settings.masterVolume, now);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(settings.musicVolume * 0.4, now);
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(settings.sfxVolume, now);
    if (this.ambienceGain) this.ambienceGain.gain.setValueAtTime(settings.ambienceVolume * 0.5, now);
  }

  setZoneIndoors(indoors: boolean): void {
    this.isIndoors = indoors;
    if (!this.ctx || !this.lowpassFilter) return;
    const targetFreq = indoors ? 2200 : 18000;
    this.lowpassFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
  }

  playUiClick(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCoin(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Cheerful arpeggio: B5 then E6
    const notes = [987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  }

  playError(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playFootstep(): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;

    // Filtered noise pop
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = this.isIndoors ? 350 : 250;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
  }

  playDoor(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  playGrillSizzle(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  private startProceduralAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;

    // Continuous pink noise / low city rumble
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.04;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;

    source.connect(filter);
    filter.connect(this.ambienceGain);
    source.start();
    this.ambienceNode = source;
  }

  private startProceduralMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    // Warm, peaceful lofi chord progression in C major / A minor
    // Am7 -> Fmaj7 -> Cmaj7 -> Gsus4
    const chords = [
      [220.00, 261.63, 329.63, 392.00], // A3, C4, E4, G4
      [174.61, 261.63, 329.63, 349.23], // F3, C4, E4, F4
      [261.63, 329.63, 392.00, 493.88], // C4, E4, G4, B4
      [196.00, 293.66, 329.63, 392.00], // G3, D4, E4, G4
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const notes = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.035, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, now + 4.8);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 5.0);
      });
    };

    // Play first chord after 1 second, then repeat every 5 seconds
    setTimeout(playChord, 1000);
    this.musicIntervalId = window.setInterval(playChord, 5200);
  }

  dispose(): void {
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {
        // ignore
      }
      this.ctx = null;
    }
  }
}

export const globalAudio = new AudioManager();
