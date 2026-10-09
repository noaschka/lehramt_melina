import type { AppState, Modul } from '../types';
import { MODUL_KATALOG } from './moduleSeed';
import { STUNDENPLAN } from './stundenplanSeed';

function katalogAlsModule(): Modul[] {
  return MODUL_KATALOG.map((m) => ({
    ...m,
    id: `modul-${m.kuerzel.toLowerCase()}`,
    semesterIst: null,
    status: 'offen',
    pruefungstermin: null,
    anmeldefrist: null,
    voraussetzungen: [],
    dokumente: [],
    versuche: [],
  }));
}

export function defaultState(): AppState {
  return {
    module: katalogAlsModule(),
    lernplaene: [],
    wochenplaene: [],
    semester: [],
    stundenplan: STUNDENPLAN,
    settings: {
      studiengang: 'Lehramt Gymnasium (Englisch, Politik und Gesellschaft)',
      hochschule: 'Universität Passau',
      gesamtEctsSoll: 0,
      regelstudienzeitEnde: null,
      zielschnitt: null,
      spacedRepetitionIntervalleTage: [1, 3, 7, 14, 30],
      abWochen: { aUngerade: true, labelA: 'Woche A', labelB: 'Woche B' },
    },
  };
}
