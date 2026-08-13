export type VideoAlign = 'left' | 'center' | 'right';
export type VideoOrientation = 'portrait' | 'landscape';

export interface VideoMoment {
  id: string;
  name: string;
  relation: string;
  src: string;
  align: VideoAlign;
  orientation: VideoOrientation;
  interlude?: string;
  playing: boolean;
  ready: boolean;
  failed: boolean;
  currentTime: number;
  duration: number;
}

export type VideoMomentContent = Omit<
  VideoMoment,
  'playing' | 'ready' | 'failed' | 'currentTime' | 'duration'
>;
