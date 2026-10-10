import type { Modul } from '../types';

/**
 * Noch kein Modulhandbuch hinterlegt - Module werden selbst über
 * "+ Modul hinzufügen" angelegt.
 */
export const MODUL_KATALOG: Omit<
  Modul,
  'id' | 'semesterIst' | 'status' | 'pruefungstermin' | 'anmeldefrist' | 'voraussetzungen' | 'dokumente' | 'versuche'
>[] = [];
