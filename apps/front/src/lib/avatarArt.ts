import type { Avatar } from '../app/account/domain/entities/Avatar';

/**
 * Les cinq pilotes, partagés par le site (SVG) et l'app (`react-native-svg`) :
 * une seule source pour les tracés et les couleurs, sans quoi le même compte
 * aurait deux visages. Un casque intégral, visière baissée, dans une livrée de
 * « Signal Riviera » : bleu du panneau P, jaune des marquages (seulement sur
 * l'encre), mer de la Riviera, bitume, damier d'arrivée.
 *
 * Les renderers ne décident rien : ils peignent `background`, puis `body`, puis
 * la coque, puis `onShell` découpé à la coque, puis `front`.
 */

// Le cadre serre le casque : à 28 px, dans l'en-tête, il doit rester lisible.
export const AVATAR_VIEWBOX = '5 6 54 54';
export const AVATAR_DISC = { cx: 32, cy: 33, r: 27 } as const;

export interface PilotLayer {
  d: string;
  fill: string;
  opacity?: number;
}

export interface PilotDrawing {
  background: string;
  body: PilotLayer[];
  shell: PilotLayer;
  onShell: PilotLayer[];
  front: PilotLayer[];
}

const SHAPES = {
  suit: 'M4 66C4 53 16 46.5 32 46.5S60 53 60 66Z',
  collar: 'M20.5 46.2C22.8 51 27 53.6 32 53.6S41.2 51 43.5 46.2L40.6 43.4H23.4Z',
  shell:
    'M32 9.5C20.4 9.5 13.2 17.6 13.2 29.2C13.2 37.4 15.6 43.4 19.8 47C23.2 49.9 27.4 51 32 51S40.8 49.9 44.2 47C48.4 43.4 50.8 37.4 50.8 29.2C50.8 17.6 43.6 9.5 32 9.5Z',
  shade:
    'M44.2 47C48.4 43.4 50.8 37.4 50.8 29.2C50.8 20.6 46.8 14 40 11.2C44.4 15.4 46.6 21.6 46.6 29.2C46.6 37 44.4 42.8 40 46.4C38.2 47.8 36 48.8 33.4 49.3C37.6 49.8 41.6 49.2 44.2 47Z',
  gloss: 'M19.6 21.4C21.2 15.8 25.6 12.2 31 11.6C26.6 14 23.6 17.4 22.2 22.2Z',
  visor:
    'M17.4 27.6C17.4 24.8 19.6 22.8 22.6 22.8H41.4C44.4 22.8 46.6 24.8 46.6 27.6V31.2C46.6 34.6 44.2 37 40.8 37H23.2C19.8 37 17.4 34.6 17.4 31.2Z',
  glint: 'M35.4 23.6H40.2L34.6 36.2H29.8Z',
  glintThin: 'M42 23.6H44L38.6 36.2H36.6Z',
  pivots:
    'M15.4 30.2a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0ZM44.8 30.2a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0Z',
  vents: 'M27.4 41.2h2.2v3.2h-2.2zM30.9 41.2h2.2v3.2h-2.2zM34.4 41.2h2.2v3.2h-2.2z',
} as const;

// Un damier de 3,6 unités sur le sommet du casque, découpé par la coque.
const CHECKERS = Array.from({ length: 4 }, (_, row) =>
  Array.from({ length: 11 }, (_, column) =>
    (row + column) % 2 === 0
      ? `M${(12.2 + column * 3.6).toFixed(1)} ${(8.4 + row * 3.6).toFixed(1)}h3.6v3.6h-3.6z`
      : '',
  ).join(''),
).join('');

interface Livery {
  background: string;
  shell: string;
  shade: string;
  visor: string;
  suit: string;
  collar: string;
  vents: string;
  decals: PilotLayer[];
}

const LIVERIES: Record<Avatar, Livery> = {
  // Le bleu du panneau P, trois bandes blanches.
  SIGNAL: {
    background: '#d9e6ff',
    shell: '#1f46e0',
    shade: '#1a37b4',
    visor: '#141e45',
    suit: '#3a64f8',
    collar: '#141e45',
    vents: '#141e45',
    decals: [
      { d: 'M29.2 9.9C30.1 9.6 31 9.5 32 9.5S33.9 9.6 34.8 9.9V22.8H29.2Z', fill: '#ffffff' },
      { d: 'M26.4 10.6L27.6 10.2V22.8H26.4ZM36.4 10.2L37.6 10.6V22.8H36.4Z', fill: '#ffffff' },
    ],
  },
  // Le jaune des marquages au sol, sur l'encre, doublé d'une ligne continue.
  MARKING: {
    background: '#232836',
    shell: '#ffd23f',
    shade: '#f5b700',
    visor: '#141821',
    suit: '#0b0d12',
    collar: '#ffd23f',
    vents: '#0b0d12',
    decals: [{ d: 'M27.6 10.4L30 9.8V22.8H27.6ZM34 9.8L36.4 10.4V22.8H34Z', fill: '#0b0d12' }],
  },
  // La mer de la Riviera, une vague blanche.
  RIVIERA: {
    background: '#c9ecfa',
    shell: '#1f9bd1',
    shade: '#177fae',
    visor: '#0b3a52',
    suit: '#3fb6e8',
    collar: '#0b3a52',
    vents: '#0b3a52',
    decals: [
      {
        d: 'M13.6 25C18 21.4 22 21.8 26 19.6S33 14.6 38 15.4 45.6 18.4 49.6 21.6L50.2 24.4C46 21.4 42 19.6 38 19.4S31 21.8 27 23.8 18.6 26.6 13.4 28.2Z',
        fill: '#ffffff',
      },
    ],
  },
  // Le bitume, un chevron jaune.
  ASPHALT: {
    background: '#dde1e8',
    shell: '#232836',
    shade: '#141821',
    visor: '#0b0d12',
    suit: '#3e465d',
    collar: '#ffd23f',
    vents: '#ffd23f',
    decals: [{ d: 'M24.4 13.6L32 18.6L39.6 13.6V16.8L32 21.8L24.4 16.8Z', fill: '#ffd23f' }],
  },
  // Le damier de l'arrivée, sur le bleu du panneau.
  CHECKERED: {
    background: '#1f46e0',
    shell: '#f4f5f8',
    shade: '#c3cad6',
    visor: '#141821',
    suit: '#eceef2',
    collar: '#0b0d12',
    vents: '#0b0d12',
    decals: [{ d: CHECKERS, fill: '#0b0d12' }],
  },
};

export const pilotDrawingOf = (avatar: Avatar): PilotDrawing => {
  const livery = LIVERIES[avatar];
  return {
    background: livery.background,
    body: [
      { d: SHAPES.suit, fill: livery.suit },
      { d: SHAPES.collar, fill: livery.collar },
    ],
    shell: { d: SHAPES.shell, fill: livery.shell },
    // L'ombre d'abord : les motifs restent francs, le damier ne grisaille pas.
    onShell: [
      { d: SHAPES.shade, fill: livery.shade, opacity: 0.55 },
      ...livery.decals,
      { d: SHAPES.gloss, fill: '#ffffff', opacity: 0.32 },
    ],
    front: [
      { d: SHAPES.visor, fill: livery.visor },
      { d: SHAPES.glint, fill: '#ffffff', opacity: 0.22 },
      { d: SHAPES.glintThin, fill: '#ffffff', opacity: 0.14 },
      { d: SHAPES.pivots, fill: livery.shade },
      { d: SHAPES.vents, fill: livery.vents },
    ],
  };
};
