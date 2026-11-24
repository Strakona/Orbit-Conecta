// Temas de sala (puros): paletas distintas e vibrantes para identificar cada projeto (demanda)
// visualmente no prédio e separá-los claramente das áreas comuns (Recepção, Copa, Banheiros, Lounge).
import type { RoomTheme } from './api';

const THEMES: readonly RoomTheme[] = [
  { carpet: '#b8dcf2', carpet2: '#a4d0ec', wall: { base: '#dbeffe', trim: '#0284c7', accent: '#0284c7', pattern: 'stripes' }, accent: '#0284C7', deskVariant: 'white', chairVariant: 'blue' },
  { carpet: '#b7e4cf', carpet2: '#a1d8be', wall: { base: '#dcfce7', trim: '#059669', accent: '#059669', pattern: 'wood_panel' }, accent: '#059669', deskVariant: 'wood', chairVariant: 'green' },
  { carpet: '#f6d7a7', carpet2: '#edc88e', wall: { base: '#fef3c7', trim: '#d97706', accent: '#d97706', pattern: 'stripes' }, accent: '#D97706', deskVariant: 'wood', chairVariant: 'black' },
  { carpet: '#d5c6f7', carpet2: '#c4b1f2', wall: { base: '#ede9fe', trim: '#7c3aed', accent: '#7c3aed', pattern: 'plain' }, accent: '#7C3AED', deskVariant: 'white', chairVariant: 'gray' },
  { carpet: '#f5c2cc', carpet2: '#ecadba', wall: { base: '#ffe4e6', trim: '#e11d48', accent: '#e11d48', pattern: 'plain' }, accent: '#E11D48', deskVariant: 'wood', chairVariant: 'red' },
  { carpet: '#aee3ea', carpet2: '#97d7e0', wall: { base: '#cffafe', trim: '#0891b2', accent: '#0891b2', pattern: 'stripes' }, accent: '#0891B2', deskVariant: 'white', chairVariant: 'green' },
  { carpet: '#f3c1df', carpet2: '#eaadd2', wall: { base: '#fce7f3', trim: '#db2777', accent: '#db2777', pattern: 'plain' }, accent: '#DB2777', deskVariant: 'white', chairVariant: 'black' },
  { carpet: '#d3eab1', carpet2: '#c2df97', wall: { base: '#ecfccb', trim: '#65a30d', accent: '#65a30d', pattern: 'wood_panel' }, accent: '#65A30D', deskVariant: 'wood', chairVariant: 'green' },
  { carpet: '#bccff9', carpet2: '#a6bff6', wall: { base: '#dbeafe', trim: '#2563eb', accent: '#2563eb', pattern: 'brick' }, accent: '#2563EB', deskVariant: 'dark', chairVariant: 'blue' },
  { carpet: '#f5c7a8', carpet2: '#ecb590', wall: { base: '#ffedd5', trim: '#ea580c', accent: '#ea580c', pattern: 'wood_panel' }, accent: '#EA580C', deskVariant: 'dark', chairVariant: 'gray' },
];

export const THEME_COUNT = THEMES.length;
export const PROJECT_THEME_ACCENTS: readonly string[] = THEMES.map((t) => t.accent);

export function roomTheme(seed: number): RoomTheme {
  const n = THEMES.length;
  const t = THEMES[((Math.floor(seed) % n) + n) % n];
  return { ...t, wall: { ...t.wall } };
}
