import { VideoMoment, VideoMomentContent } from '../models/video-moment';

const CONTENT: readonly VideoMomentContent[] = [
  {
    id: 'kelly',
    name: 'Kelly',
    relation: 'irmã',
    src: 'videos/kelly.mp4',
    align: 'left',
    orientation: 'portrait',
    interlude: 'Algumas pessoas continuam perto, mesmo quando estão longe.'
  },
  {
    id: 'amanda',
    name: 'Amanda',
    relation: 'amiga',
    src: 'videos/amanda.mp4',
    align: 'center',
    orientation: 'portrait'
  },
  {
    id: 'andre',
    name: 'André',
    relation: 'amigo',
    src: 'videos/andre.mp4',
    align: 'right',
    orientation: 'portrait'
  },
  {
    id: 'augusto',
    name: 'Augusto',
    relation: 'amigo',
    src: 'videos/augusto.mp4',
    align: 'center',
    orientation: 'landscape',
    interlude: 'Tem amor que encontra caminho, não importa a distância.'
  },
  {
    id: 'cassiane',
    name: 'Cassiane',
    relation: 'amiga',
    src: 'videos/cassiane.mp4',
    align: 'left',
    orientation: 'portrait'
  },
  {
    id: 'elisa',
    name: 'Elisa',
    relation: 'amiga',
    src: 'videos/elisa.mp4',
    align: 'right',
    orientation: 'portrait'
  },
  {
    id: 'germano',
    name: 'Germano',
    relation: 'amigo',
    src: 'videos/germano.mp4',
    align: 'center',
    orientation: 'portrait',
    interlude: 'Cada mensagem tem um jeito único de dizer: eu te amo!'
  },
  {
    id: 'gustavo',
    name: 'Gustavo',
    relation: 'amigo',
    src: 'videos/gustavo.mp4',
    align: 'left',
    orientation: 'landscape'
  },
  {
    id: 'joao',
    name: 'João',
    relation: 'amigo',
    src: 'videos/joao.mp4',
    align: 'right',
    orientation: 'portrait'
  },
  {
    id: 'amanda-germano-cassiane',
    name: 'Amanda, Germano e Cassiane',
    relation: 'amigos',
    src: 'videos/amanda-germano-cassiane.mp4',
    align: 'center',
    orientation: 'landscape'
  }
];

export function createVideoMoments(): VideoMoment[] {
  return CONTENT.map((moment) => ({
    ...moment,
    playing: false,
    ready: false,
    failed: false,
    currentTime: 0,
    duration: 0
  }));
}
