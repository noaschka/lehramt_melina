import type { Modul } from '../types';

export interface GeparsteZeile {
  name: string;
  kuerzel: string;
  fach: string | null;
  semesterSoll: number;
  ects: number;
  pruefungsform: string;
}

export interface TabellenImportErgebnis {
  zeilen: GeparsteZeile[];
  uebersprungen: number;
}

const HEADER_WOERTER = ['name', 'modul', 'modulname', 'fach', 'kürzel', 'kuerzel', 'semester', 'ects'];

function erkenneTrenner(zeilen: string[]): string {
  const kandidaten = ['\t', ';', ','];
  for (const trenner of kandidaten) {
    const anzahlFelder = zeilen.slice(0, 5).map((z) => z.split(trenner).length);
    if (anzahlFelder.some((n) => n > 1)) return trenner;
  }
  return '\t';
}

function istHeaderZeile(felder: string[]): boolean {
  const erste = felder[0]?.trim().toLowerCase() ?? '';
  return HEADER_WOERTER.includes(erste);
}

/**
 * Erwartete Spaltenreihenfolge: Name, Kürzel, Fach, Semester, ECTS, Prüfungsform.
 * Nur "Name" ist Pflicht, der Rest ist optional und wird mit sinnvollen Standardwerten aufgefüllt.
 * Unterstützt Tab-, Semikolon- oder Komma-getrennte Zeilen (z.B. aus Excel kopiert).
 */
export function parseTabellenZeilen(text: string): TabellenImportErgebnis {
  const rohZeilen = text
    .split('\n')
    .map((z) => z.replace(/\r$/, ''))
    .filter((z) => z.trim().length > 0);

  if (!rohZeilen.length) return { zeilen: [], uebersprungen: 0 };

  const trenner = erkenneTrenner(rohZeilen);
  const zeilen: GeparsteZeile[] = [];
  let uebersprungen = 0;

  rohZeilen.forEach((zeile, i) => {
    const felder = zeile.split(trenner).map((f) => f.trim());
    if (i === 0 && istHeaderZeile(felder)) return;

    const [name, kuerzel, fach, semester, ects, pruefungsform] = felder;
    if (!name) {
      uebersprungen++;
      return;
    }

    zeilen.push({
      name,
      kuerzel: kuerzel || name.slice(0, 10).toUpperCase().replace(/\s+/g, ''),
      fach: fach || null,
      semesterSoll: semester && !Number.isNaN(Number(semester)) ? Number(semester) : 1,
      ects: ects && !Number.isNaN(Number(ects.replace(',', '.'))) ? Number(ects.replace(',', '.')) : 5,
      pruefungsform: pruefungsform || '',
    });
  });

  return { zeilen, uebersprungen };
}

export function zeileZuModul(zeile: GeparsteZeile): Omit<Modul, 'id' | 'versuche' | 'dokumente'> {
  return {
    name: zeile.name,
    kuerzel: zeile.kuerzel,
    fach: zeile.fach,
    semesterSoll: zeile.semesterSoll,
    semesterIst: null,
    ects: zeile.ects,
    swsVorlesung: 0,
    workloadGesamt: zeile.ects * 30,
    pruefungsform: zeile.pruefungsform,
    status: 'offen',
    pruefungstermin: null,
    anmeldefrist: null,
    voraussetzungen: [],
    inhalte: '',
    lehrziele: '',
  };
}
