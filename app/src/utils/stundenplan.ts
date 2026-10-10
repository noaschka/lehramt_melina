import { parseISO, getISOWeek } from 'date-fns';
import type { AbWochenSettings, StundenplanBlock, WochenplanEintrag } from '../types';

export type WochenTyp = 'A' | 'B';

export function wochenTyp(montagIso: string, abWochen: AbWochenSettings): WochenTyp {
  const istUngerade = getISOWeek(parseISO(montagIso)) % 2 === 1;
  if (abWochen.aUngerade) return istUngerade ? 'A' : 'B';
  return istUngerade ? 'B' : 'A';
}

export function bloeckeDerWoche(stundenplan: StundenplanBlock[], typ: WochenTyp): StundenplanBlock[] {
  return stundenplan.filter((b) => b.wochen === 'AB' || b.wochen === typ);
}

export function blockDauerMin(block: StundenplanBlock): number {
  const [startH, startM] = block.start.split(':').map(Number);
  const [endH, endM] = block.ende.split(':').map(Number);
  return endH * 60 + endM - (startH * 60 + startM);
}

export function blockStartMin(block: StundenplanBlock): number {
  const [h, m] = block.start.split(':').map(Number);
  return h * 60 + m;
}

export function blockEndeMin(block: StundenplanBlock): number {
  const [h, m] = block.ende.split(':').map(Number);
  return h * 60 + m;
}

const STANDARD_START_MIN = 8 * 60;
const STANDARD_ENDE_MIN = 18 * 60;

export function zeitRasterBereich(bloeckeDerWoche: StundenplanBlock[]): { startMin: number; endeMin: number } {
  const startMin = Math.min(STANDARD_START_MIN, ...bloeckeDerWoche.map(blockStartMin));
  const endeMin = Math.max(STANDARD_ENDE_MIN, ...bloeckeDerWoche.map(blockEndeMin));
  return { startMin, endeMin };
}

const WOCHENTAGE_MO_FR = [0, 1, 2, 3, 4];

export function aktiveWochentage(bloeckeDerWoche: StundenplanBlock[]): number[] {
  const wochenende = [5, 6].filter((tag) => bloeckeDerWoche.some((b) => b.wochentag === tag));
  return [...WOCHENTAGE_MO_FR, ...wochenende];
}

export function sollMinutenDerWoche(stundenplanDerWoche: StundenplanBlock[], eintraege: WochenplanEintrag[]): number {
  const lernblockMin = stundenplanDerWoche.filter((b) => b.art === 'lernblock').reduce((s, b) => s + blockDauerMin(b), 0);
  const manuelleMin = eintraege.filter((e) => !e.blockId).reduce((s, e) => s + e.geplantMin, 0);
  return lernblockMin + manuelleMin;
}

export function istMinutenDerWoche(eintraege: WochenplanEintrag[]): number {
  return eintraege.reduce((s, e) => s + e.tatsaechlichMin, 0);
}

export function kalenderwoche(montagIso: string): number {
  return getISOWeek(parseISO(montagIso));
}

function hexZuRgb(hex: string): [number, number, number] {
  const normal = hex.replace('#', '');
  const voll = normal.length === 3 ? normal.split('').map((c) => c + c).join('') : normal;
  const num = parseInt(voll, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Liefert '#000000' oder '#ffffff' je nachdem, was auf der Hintergrundfarbe besser lesbar ist. */
export function kontrastText(hex: string): string {
  const [r, g, b] = hexZuRgb(hex);
  const luminanz = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminanz > 0.6 ? '#000000' : '#ffffff';
}

/** Mischt eine Hex-Farbe mit Schwarz (0 = unverändert, 1 = ganz schwarz) - für den "erledigt"-Zustand. */
export function abdunkeln(hex: string, anteil: number): string {
  const [r, g, b] = hexZuRgb(hex);
  const mix = (kanal: number) => Math.round(kanal * (1 - anteil));
  const zuHex = (kanal: number) => kanal.toString(16).padStart(2, '0');
  return `#${zuHex(mix(r))}${zuHex(mix(g))}${zuHex(mix(b))}`;
}
