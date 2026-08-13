import { Injectable } from '@angular/core';

type SoundEffect = 'welcome' | 'play' | 'pause' | 'reveal' | 'complete';
type SoundNote = readonly [frequency: number, delay: number, duration: number, volume: number];

const PATTERNS: Record<SoundEffect, readonly SoundNote[]> = {
  welcome: [
    [392, 0, 0.72, 0.07],
    [523.25, 0.12, 0.82, 0.058],
    [659.25, 0.26, 0.94, 0.046]
  ],
  play: [
    [329.63, 0, 0.22, 0.052],
    [493.88, 0.07, 0.32, 0.04]
  ],
  pause: [
    [392, 0, 0.2, 0.04],
    [293.66, 0.06, 0.26, 0.032]
  ],
  reveal: [
    [587.33, 0, 0.5, 0.038],
    [739.99, 0.09, 0.58, 0.028]
  ],
  complete: [
    [523.25, 0, 0.55, 0.048],
    [659.25, 0.1, 0.64, 0.04],
    [783.99, 0.2, 0.78, 0.032]
  ]
};

@Injectable({ providedIn: 'root' })
export class ExperienceAudioService {
  private context?: AudioContext;
  private master?: GainNode;
  private ready = false;
  private readonly soundedReveals = new WeakSet<Element>();

  async enable(playWelcome: boolean): Promise<boolean> {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.context.destination);
      }

      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      const wasReady = this.ready;
      this.ready = this.context.state === 'running';

      if (this.ready && !wasReady && playWelcome) {
        this.play('welcome');
      }

      return this.ready;
    } catch {
      this.ready = false;
      return false;
    }
  }

  playReveal(element: Element): void {
    if (
      !this.ready ||
      this.soundedReveals.has(element) ||
      !element.matches('.video-content, .interlude, .birthday__content, .closing__content')
    ) {
      return;
    }

    this.soundedReveals.add(element);
    this.play(element.matches('.birthday__content, .closing__content') ? 'complete' : 'reveal');
  }

  play(effect: SoundEffect): void {
    if (!this.ready || !this.context || this.context.state !== 'running' || !this.master) {
      return;
    }

    const now = this.context.currentTime;
    PATTERNS[effect].forEach(([frequency, delay, duration, volume]) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = now + delay;
      const end = start + duration;

      oscillator.type = effect === 'pause' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.035, duration / 3));
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(this.master!);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    });
  }

  async destroy(): Promise<void> {
    this.ready = false;
    await this.context?.close();
  }
}
