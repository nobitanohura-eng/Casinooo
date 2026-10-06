/**
 * Web Audio API synthesized sound generator for subtle, premium arcade UI feedback.
 * Zero external asset dependencies — completely hermetic, zero-latency, and responsive.
 */

type SoundType = 'click' | 'chip' | 'bet' | 'win' | 'cashout' | 'countdown' | 'crash' | 'lock';

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private listeners: Set<(enabled: boolean) => void> = new Set();

  // Dynamic Turbine Hum Audio Nodes for Aviator
  private turbineOsc: OscillatorNode | null = null;
  private turbineGain: GainNode | null = null;
  private turbineFilter: BiquadFilterNode | null = null;
  private isTurbineRunning: boolean = false;

  constructor() {
    const saved = localStorage.getItem('apex_arcade_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('apex_arcade_sound_enabled', String(enabled));
    this.listeners.forEach((l) => l(enabled));
  }

  public toggle(): boolean {
    const next = !this.soundEnabled;
    this.setEnabled(next);
    if (next) {
      this.play('click');
    }
    return next;
  }

  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public play(type: SoundType) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      switch (type) {
        case 'click': {
          // Soft tactile pop (600Hz -> 300Hz, 35ms)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(280, now + 0.035);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.035);
          break;
        }

        case 'chip': {
          // Subtle higher tick for chip / multiplier selection
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(950, now);
          osc.frequency.exponentialRampToValueAtTime(500, now + 0.025);
          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.025);
          break;
        }

        case 'bet': {
          // Pleasant two-tone ascending confirmation (C5 -> E5, 120ms)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'triangle';
          osc2.type = 'sine';

          osc1.frequency.setValueAtTime(523.25, now); // C5
          osc1.frequency.setValueAtTime(659.25, now + 0.06); // E5

          osc2.frequency.setValueAtTime(1046.5, now); // C6 overtone
          osc2.frequency.setValueAtTime(1318.5, now + 0.06);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.14);
          osc2.stop(now + 0.14);
          break;
        }

        case 'win': {
          // Victorious harmonic chime (C5 -> E5 -> G5 -> C6)
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + idx * 0.07;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.06, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.25);
          });
          break;
        }

        case 'cashout': {
          // Energetic Aviator cash-out shimmer (E5 -> G#5 -> B5 -> E6)
          const notes = [659.25, 830.61, 987.77, 1318.51];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + idx * 0.05;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.07, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.22);
          });
          break;
        }

        case 'countdown': {
          // Gentle woodblock tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'lock': {
          // Double soft warning pulse when betting locks (440Hz -> 330Hz)
          [0, 0.08].forEach((offset, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + offset;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(idx === 0 ? 440 : 370, startTime);
            gain.gain.setValueAtTime(0.05, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.06);
          });
          break;
        }

        case 'crash': {
          // Deep soft descending whoosh/rumble for Aviator crash
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
      }
    } catch {
      // Audio playback errors handled gracefully
    }
  }

  /**
   * Start synthetic turbine hum during Aviator flight
   */
  public startTurbineHum() {
    if (!this.soundEnabled || this.isTurbineRunning) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);

      this.turbineOsc = osc;
      this.turbineGain = gain;
      this.turbineFilter = filter;
      this.isTurbineRunning = true;
    } catch {
      // Audio context error
    }
  }

  /**
   * Climb turbine pitch subtly as flight multiplier increases
   */
  public updateTurbinePitch(multiplier: number) {
    if (!this.isTurbineRunning || !this.turbineOsc || !this.turbineFilter) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Pitch subtly climbs: 120Hz at 1.00x -> up to ~550Hz at 15.00x
      const targetFreq = Math.min(650, 120 + Math.max(0, multiplier - 1.0) * 38);
      const targetFilter = Math.min(1800, 450 + Math.max(0, multiplier - 1.0) * 95);

      this.turbineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
      this.turbineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
    } catch {
      // Ignore audio glitches
    }
  }

  /**
   * Stop turbine hum, optionally triggering crash whoosh
   */
  public stopTurbineHum(withCrashWhoosh = false) {
    if (!this.isTurbineRunning) return;
    this.isTurbineRunning = false;

    try {
      const ctx = this.getContext();
      if (ctx && this.turbineGain) {
        const now = ctx.currentTime;
        this.turbineGain.gain.setValueAtTime(this.turbineGain.gain.value, now);
        this.turbineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      }

      setTimeout(() => {
        try {
          if (this.turbineOsc) {
            this.turbineOsc.stop();
            this.turbineOsc.disconnect();
          }
          if (this.turbineGain) this.turbineGain.disconnect();
          if (this.turbineFilter) this.turbineFilter.disconnect();
        } catch {}
        this.turbineOsc = null;
        this.turbineGain = null;
        this.turbineFilter = null;
      }, 150);

      if (withCrashWhoosh) {
        this.play('crash');
      }
    } catch {
      this.turbineOsc = null;
      this.turbineGain = null;
      this.turbineFilter = null;
    }
  }
}

export const soundManager = new SoundManager();
