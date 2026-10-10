import type { BlockArt, StundenplanBlock } from '../types';

export interface GeparsterBlock {
  wochentag: number;
  start: string;
  ende: string;
  titel: string;
  kurz: string;
  fach: string | null;
  notiz: string;
  art: BlockArt;
  wochen: StundenplanBlock['wochen'];
}

export interface StundenplanImportErgebnis {
  bloecke: GeparsterBlock[];
  uebersprungen: number;
}

const TAG_NAMEN: Record<string, number> = {
  mo: 0,
  montag: 0,
  di: 1,
  dienstag: 1,
  mi: 2,
  mittwoch: 2,
  do: 3,
  donnerstag: 3,
  fr: 4,
  freitag: 4,
  sa: 5,
  samstag: 5,
  so: 6,
  sonntag: 6,
};

const ART_NAMEN: Record<string, BlockArt> = {
  vorlesung: 'vorlesung',
  lernblock: 'lernblock',
  frei: 'frei',
};

const HEADER_WOERTER = ['tag', 'wochentag', 'start', 'titel', 'name'];

function erkenneTrenner(zeilen: string[]): string {
  const kandidaten = ['\t', ';', ','];
  for (const trenner of kandidaten) {
    const anzahlFelder = zeilen.slice(0, 5).map((z) => z.split(trenner).length);
    if (anzahlFelder.some((n) => n > 1)) return trenner;
  }
  return '\t';
}

function parseTag(wert: string): number | null {
  const normal = wert.trim().toLowerCase();
  if (normal in TAG_NAMEN) return TAG_NAMEN[normal];
  const num = Number(normal);
  return Number.isInteger(num) && num >= 0 && num <= 6 ? num : null;
}

function parseZeit(wert: string): string | null {
  const normal = wert.trim().replace('.', ':');
  return /^\d{1,2}:\d{2}$/.test(normal) ? normal.padStart(5, '0') : null;
}

/**
 * Erwartete Spaltenreihenfolge: Tag, Start, Ende, Titel, Kurztitel, Fach, Notiz, Art, Wochen.
 * Nur Tag/Start/Ende/Titel sind Pflicht. Art (Standard: vorlesung) und Wochen (Standard: AB) optional.
 */
export function parseStundenplanZeilen(text: string): StundenplanImportErgebnis {
  const rohZeilen = text
    .split('\n')
    .map((z) => z.replace(/\r$/, ''))
    .filter((z) => z.trim().length > 0);

  if (!rohZeilen.length) return { bloecke: [], uebersprungen: 0 };

  const trenner = erkenneTrenner(rohZeilen);
  const bloecke: GeparsterBlock[] = [];
  let uebersprungen = 0;

  rohZeilen.forEach((zeile, i) => {
    const felder = zeile.split(trenner).map((f) => f.trim());
    if (i === 0 && HEADER_WOERTER.includes(felder[0]?.toLowerCase())) return;

    const [tagRoh, startRoh, endeRoh, titel, kurz, fach, notiz, artRoh, wochenRoh] = felder;
    const wochentag = parseTag(tagRoh ?? '');
    const start = parseZeit(startRoh ?? '');
    const ende = parseZeit(endeRoh ?? '');

    if (wochentag === null || !start || !ende || !titel) {
      uebersprungen++;
      return;
    }

    bloecke.push({
      wochentag,
      start,
      ende,
      titel,
      kurz: kurz || titel.slice(0, 10),
      fach: fach || null,
      notiz: notiz || '',
      art: ART_NAMEN[artRoh?.toLowerCase() ?? ''] ?? 'vorlesung',
      wochen: wochenRoh === 'A' || wochenRoh === 'B' ? wochenRoh : 'AB',
    });
  });

  return { bloecke, uebersprungen };
}

export function blockZuStundenplanBlock(b: GeparsterBlock, id: string): StundenplanBlock {
  return {
    id,
    wochentag: b.wochentag,
    start: b.start,
    ende: b.ende,
    art: b.art,
    titel: b.titel,
    kurz: b.kurz,
    modulId: null,
    fach: b.fach,
    wochen: b.wochen,
    notiz: b.notiz,
    quelle: 'import',
  };
}
