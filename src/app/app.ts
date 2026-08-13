import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  QueryList,
  signal,
  ViewChildren
} from '@angular/core';
import { STARS } from './data/stars';
import { createVideoMoments } from './data/video-moments';
import { ExperienceAudioService } from './services/experience-audio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChildren('messageVideo') private videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  protected readonly introVisible = signal(true);
  protected readonly introLeaving = signal(false);
  protected readonly moments = createVideoMoments();
  protected readonly stars = STARS;
  protected readonly currentYear = new Date().getFullYear();

  private readonly audio = inject(ExperienceAudioService);
  private observer?: IntersectionObserver;
  private rafId = 0;
  private introExitTimer = 0;
  private introRemoveTimer = 0;
  private prefersReducedMotion = false;
  private soundUnlocking = false;
  private fullscreenRequestPending = false;
  private previousScrollRestoration: ScrollRestoration = 'auto';

  ngAfterViewInit(): void {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.startIntro();
    this.updateJourney();

    window.addEventListener('scroll', this.requestJourneyUpdate, { passive: true });
    window.addEventListener('resize', this.requestJourneyUpdate, { passive: true });
    document.addEventListener('pointerdown', this.handleFirstSoundGesture, { passive: true });
    document.addEventListener('keydown', this.handleFirstSoundGesture);
    document.addEventListener('click', this.handleFirstSoundGesture, { passive: true });
    document.addEventListener('pointerdown', this.handleFullscreenGesture);
    document.addEventListener('touchend', this.handleFullscreenGesture);
    document.addEventListener('click', this.handleFullscreenGesture);
    document.addEventListener('keydown', this.handleFullscreenGesture);

    const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (this.prefersReducedMotion) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.audio.playReveal(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );

    revealElements.forEach((element) => this.observer?.observe(element));
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.requestJourneyUpdate);
    window.removeEventListener('resize', this.requestJourneyUpdate);
    document.removeEventListener('pointerdown', this.handleFirstSoundGesture);
    document.removeEventListener('keydown', this.handleFirstSoundGesture);
    document.removeEventListener('click', this.handleFirstSoundGesture);
    document.removeEventListener('pointerdown', this.handleFullscreenGesture);
    document.removeEventListener('touchend', this.handleFullscreenGesture);
    document.removeEventListener('click', this.handleFullscreenGesture);
    document.removeEventListener('keydown', this.handleFullscreenGesture);
    this.observer?.disconnect();
    cancelAnimationFrame(this.rafId);
    window.clearTimeout(this.introExitTimer);
    window.clearTimeout(this.introRemoveTimer);
    document.documentElement.classList.remove('intro-active');
    window.history.scrollRestoration = this.previousScrollRestoration;
    void this.audio.destroy();
  }

  protected async toggleVideo(index: number): Promise<void> {
    const video = this.videoElements.get(index)?.nativeElement;
    const moment = this.moments[index];

    if (!video || !moment || moment.failed) {
      return;
    }

    this.videoElements.forEach((item, otherIndex) => {
      if (otherIndex !== index) {
        item.nativeElement.pause();
        this.moments[otherIndex].playing = false;
      }
    });

    if (!video.paused) {
      this.audio.play('pause');
      video.pause();
      moment.playing = false;
      return;
    }

    try {
      await this.audio.enable(false);
      this.audio.play('play');
      await video.play();
      moment.playing = true;
    } catch {
      moment.playing = false;
    }
  }

  protected onLoaded(index: number, event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    const moment = this.moments[index];

    moment.ready = true;
    moment.failed = false;
    moment.duration = Number.isFinite(video.duration) ? video.duration : 0;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      moment.orientation = video.videoWidth >= video.videoHeight ? 'landscape' : 'portrait';
    }
  }

  protected onVideoError(index: number): void {
    const moment = this.moments[index];
    moment.ready = false;
    moment.failed = true;
  }

  protected onTimeUpdate(index: number, event: Event): void {
    this.moments[index].currentTime = (event.currentTarget as HTMLVideoElement).currentTime;
  }

  protected onVideoEnded(index: number): void {
    const moment = this.moments[index];
    moment.playing = false;
    moment.currentTime = 0;
    this.audio.play('complete');
  }

  protected seekVideo(index: number, event: Event): void {
    const video = this.videoElements.get(index)?.nativeElement;
    const value = Number((event.currentTarget as HTMLInputElement).value);

    if (video && Number.isFinite(value)) {
      video.currentTime = value;
    }
  }

  protected formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${rest}`;
  }

  private startIntro(): void {
    this.previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.classList.add('intro-active');
    this.introExitTimer = window.setTimeout(
      () => this.dismissIntro(),
      this.prefersReducedMotion ? 500 : 2150
    );
  }

  private dismissIntro(): void {
    if (!this.introVisible() || this.introLeaving()) {
      return;
    }

    this.introLeaving.set(true);
    this.introRemoveTimer = window.setTimeout(
      () => this.finishIntro(),
      this.prefersReducedMotion ? 0 : 1150
    );
  }

  private finishIntro(): void {
    window.scrollTo(0, 0);
    this.introVisible.set(false);
    document.documentElement.classList.remove('intro-active');
    this.updateJourney();
  }

  private readonly handleFirstSoundGesture = async (): Promise<void> => {
    if (this.soundUnlocking) {
      return;
    }

    this.soundUnlocking = true;
    const enabled = await this.audio.enable(true);

    if (enabled) {
      document.removeEventListener('pointerdown', this.handleFirstSoundGesture);
      document.removeEventListener('keydown', this.handleFirstSoundGesture);
      document.removeEventListener('click', this.handleFirstSoundGesture);
      return;
    }

    this.soundUnlocking = false;
  };

  private readonly handleFullscreenGesture = (): void => {
    const root = document.documentElement;

    if (document.fullscreenElement) {
      this.removeFullscreenListeners();
      return;
    }

    if (!root.requestFullscreen) {
      this.removeFullscreenListeners();
      return;
    }

    if (this.fullscreenRequestPending) {
      return;
    }

    this.fullscreenRequestPending = true;
    void root.requestFullscreen({ navigationUI: 'hide' })
      .then(() => this.removeFullscreenListeners())
      .catch(() => {
        this.fullscreenRequestPending = false;
      });
  };

  private removeFullscreenListeners(): void {
    document.removeEventListener('pointerdown', this.handleFullscreenGesture);
    document.removeEventListener('touchend', this.handleFullscreenGesture);
    document.removeEventListener('click', this.handleFullscreenGesture);
    document.removeEventListener('keydown', this.handleFullscreenGesture);
  }

  private readonly requestJourneyUpdate = (): void => {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.updateJourney());
  };

  private updateJourney(): void {
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    document.documentElement.style.setProperty('--journey', progress.toFixed(4));
  }
}
