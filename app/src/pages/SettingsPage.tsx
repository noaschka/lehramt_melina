import { useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useStore } from '../store/useStore';
import { Field, inputClass } from '../components/ui/FormField';
import type { AppState, Modul, StundenplanBlock } from '../types';
import { blockStartMin } from '../utils/stundenplan';
import { parseTabellenZeilen, zeileZuModul } from '../utils/tabellenImport';
import { parseStundenplanZeilen, blockZuStundenplanBlock } from '../utils/stundenplanImport';

const WOCHENTAGE_LABEL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const ART_LABEL: Record<StundenplanBlock['art'], string> = {
  lernblock: 'Lernblock',
  vorlesung: 'Vorlesung',
  frei: 'Frei',
};
const WOCHEN_LABEL: Record<StundenplanBlock['wochen'], string> = {
  AB: 'jede Woche',
  A: 'nur Woche A',
  B: 'nur Woche B',
};

const AKZENT_OPTIONEN = [
  { id: 'slate', name: 'Schiefer', farbe: '#0f172a' },
  { id: 'indigo', name: 'Indigo', farbe: '#4f46e5' },
  { id: 'rose', name: 'Rosa', farbe: '#e11d48' },
  { id: 'smaragd', name: 'Smaragd', farbe: '#059669' },
  { id: 'violett', name: 'Violett', farbe: '#7c3aed' },
  { id: 'amber', name: 'Amber', farbe: '#d97706' },
  { id: 'himmelblau', name: 'Himmelblau', farbe: '#0284c7' },
];

function neuerBlock(): StundenplanBlock {
  return {
    id: uuid(),
    wochentag: 0,
    start: '08:00',
    ende: '09:30',
    art: 'lernblock',
    titel: '',
    kurz: '',
    modulId: null,
    fach: null,
    wochen: 'AB',
    notiz: '',
    quelle: 'manuell',
  };
}

function BlockForm({
  initial,
  module,
  onSubmit,
  onAbbrechen,
}: {
  initial: StundenplanBlock;
  module: Modul[];
  onSubmit: (block: StundenplanBlock) => void;
  onAbbrechen: () => void;
}) {
  const [block, setBlock] = useState(initial);
  const faecher = Array.from(new Set(module.map((m) => m.fach).filter((f): f is string => !!f))).sort();

  function patch(p: Partial<StundenplanBlock>) {
    setBlock((b) => ({ ...b, ...p }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(block);
      }}
      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Tag">
          <select className={`${inputClass} !py-1.5 text-sm`} value={block.wochentag} onChange={(e) => patch({ wochentag: Number(e.target.value) })}>
            {WOCHENTAGE_LABEL.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start">
          <input type="time" className={`${inputClass} !py-1.5 text-sm`} value={block.start} onChange={(e) => patch({ start: e.target.value })} />
        </Field>
        <Field label="Ende">
          <input type="time" className={`${inputClass} !py-1.5 text-sm`} value={block.ende} onChange={(e) => patch({ ende: e.target.value })} />
        </Field>
        <Field label="Art">
          <select
            className={`${inputClass} !py-1.5 text-sm`}
            value={block.art}
            onChange={(e) => patch({ art: e.target.value as StundenplanBlock['art'] })}
          >
            {Object.entries(ART_LABEL).map(([wert, label]) => (
              <option key={wert} value={wert}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Titel">
          <input className={`${inputClass} !py-1.5 text-sm`} value={block.titel} onChange={(e) => patch({ titel: e.target.value })} required />
        </Field>
        <Field label="Kurztitel">
          <input className={`${inputClass} !py-1.5 text-sm`} value={block.kurz} onChange={(e) => patch({ kurz: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Fach" hint="für die Farbe im Zeitraster">
          <input
            className={`${inputClass} !py-1.5 text-sm`}
            list="block-faecher-liste"
            value={block.fach ?? ''}
            onChange={(e) => patch({ fach: e.target.value || null })}
          />
          <datalist id="block-faecher-liste">
            {faecher.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Field>
        <Field label="Modul">
          <select
            className={`${inputClass} !py-1.5 text-sm`}
            value={block.modulId ?? ''}
            onChange={(e) => patch({ modulId: e.target.value || null })}
          >
            <option value="">&ndash; kein Modul &ndash;</option>
            {module.map((m) => (
              <option key={m.id} value={m.id}>
                {m.kuerzel || m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Wochen">
          <select
            className={`${inputClass} !py-1.5 text-sm`}
            value={block.wochen}
            onChange={(e) => patch({ wochen: e.target.value as StundenplanBlock['wochen'] })}
          >
            {Object.entries(WOCHEN_LABEL).map(([wert, label]) => (
              <option key={wert} value={wert}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notiz">
        <input className={`${inputClass} !py-1.5 text-sm`} value={block.notiz} onChange={(e) => patch({ notiz: e.target.value })} />
      </Field>
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" className="rounded-lg bg-[var(--akzent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--akzent-hover)]">
          Speichern
        </button>
        <button
          type="button"
          onClick={onAbbrechen}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function TabellenImport({ bestehendeKuerzel }: { bestehendeKuerzel: Set<string> }) {
  const addModul = useStore((s) => s.addModul);
  const [text, setText] = useState('');
  const [erledigt, setErledigt] = useState<string | null>(null);

  const { zeilen, uebersprungen } = useMemo(() => parseTabellenZeilen(text), [text]);

  function importieren() {
    zeilen.forEach((zeile) => addModul(zeileZuModul(zeile)));
    setErledigt(`${zeilen.length} Modul${zeilen.length === 1 ? '' : 'e'} importiert.`);
    setText('');
    setTimeout(() => setErledigt(null), 3000);
  }

  return (
    <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Module aus Tabelle importieren</div>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Zeilen aus Excel/Numbers/einer Uni-Seite hier einfügen. Spalten (durch Tab, Semikolon oder Komma
        getrennt): <strong>Name</strong>, Kürzel, Fach, Semester, ECTS, Prüfungsform &ndash; nur Name ist
        Pflicht, der Rest bekommt sinnvolle Standardwerte. Eine Kopfzeile wird automatisch erkannt.
      </p>
      <textarea
        className={`${inputClass} font-mono text-xs`}
        rows={5}
        placeholder={'Fachdidaktik Englisch I\tENG-FD1\tEnglisch\t3\t5\tKlausur'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {zeilen.length > 0 && (
        <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 dark:bg-slate-800/60">
              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Kürzel</th>
                <th className="px-2 py-1">Fach</th>
                <th className="px-2 py-1">Sem.</th>
                <th className="px-2 py-1">ECTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {zeilen.map((z, i) => (
                <tr key={i} className={bestehendeKuerzel.has(z.kuerzel) ? 'text-amber-600 dark:text-amber-400' : ''}>
                  <td className="px-2 py-1">{z.name}</td>
                  <td className="px-2 py-1">
                    {z.kuerzel}
                    {bestehendeKuerzel.has(z.kuerzel) && ' ⚠︎'}
                  </td>
                  <td className="px-2 py-1">{z.fach ?? '–'}</td>
                  <td className="px-2 py-1">{z.semesterSoll}</td>
                  <td className="px-2 py-1">{z.ects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {uebersprungen > 0 && (
        <p className="mt-2 text-xs text-slate-400">{uebersprungen} Zeile{uebersprungen === 1 ? '' : 'n'} ohne Namen übersprungen.</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={importieren}
          disabled={!zeilen.length}
          className="rounded-lg bg-[var(--akzent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--akzent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {zeilen.length ? `${zeilen.length} Modul${zeilen.length === 1 ? '' : 'e'} importieren` : 'Importieren'}
        </button>
        {erledigt && <span className="text-sm text-emerald-600 dark:text-emerald-400">{erledigt}</span>}
      </div>
    </div>
  );
}

function StundenplanTabellenImport() {
  const upsertBlock = useStore((s) => s.upsertBlock);
  const [text, setText] = useState('');
  const [erledigt, setErledigt] = useState<string | null>(null);

  const { bloecke, uebersprungen } = useMemo(() => parseStundenplanZeilen(text), [text]);

  function importieren() {
    bloecke.forEach((b) => upsertBlock(blockZuStundenplanBlock(b, uuid())));
    setErledigt(`${bloecke.length} ${bloecke.length === 1 ? 'Block' : 'Blöcke'} importiert.`);
    setText('');
    setTimeout(() => setErledigt(null), 3000);
  }

  return (
    <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Stundenplan aus Tabelle importieren</div>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Zeilen hier einfügen (durch Tab, Semikolon oder Komma getrennt). Spalten:{' '}
        <strong>Tag</strong>, <strong>Start</strong>, <strong>Ende</strong>, <strong>Titel</strong>, Kurztitel,
        Fach, Notiz, Art (Standard: Vorlesung), Wochen (Standard: AB). Tag als Mo/Di/Mi/Do/Fr/Sa/So, Zeiten als
        HH:MM. Eine Kopfzeile wird automatisch erkannt.
      </p>
      <textarea
        className={`${inputClass} font-mono text-xs`}
        rows={5}
        placeholder={'Mo\t08:00\t10:00\tEinführung in die Linguistik\tLinguistik\tEnglisch\t(AM) HS 9'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {bloecke.length > 0 && (
        <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 dark:bg-slate-800/60">
              <tr>
                <th className="px-2 py-1">Tag</th>
                <th className="px-2 py-1">Zeit</th>
                <th className="px-2 py-1">Titel</th>
                <th className="px-2 py-1">Fach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bloecke.map((b, i) => (
                <tr key={i}>
                  <td className="px-2 py-1">{WOCHENTAGE_LABEL[b.wochentag].slice(0, 2)}</td>
                  <td className="px-2 py-1">
                    {b.start}&ndash;{b.ende}
                  </td>
                  <td className="px-2 py-1">{b.titel}</td>
                  <td className="px-2 py-1">{b.fach ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {uebersprungen > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          {uebersprungen} Zeile{uebersprungen === 1 ? '' : 'n'} übersprungen (Tag/Start/Ende/Titel fehlt oder ungültig).
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={importieren}
          disabled={!bloecke.length}
          className="rounded-lg bg-[var(--akzent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--akzent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {bloecke.length ? `${bloecke.length} ${bloecke.length === 1 ? 'Block' : 'Blöcke'} importieren` : 'Importieren'}
        </button>
        {erledigt && <span className="text-sm text-emerald-600 dark:text-emerald-400">{erledigt}</span>}
      </div>
    </div>
  );
}

function istGueltigerState(data: unknown): data is AppState {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.module) &&
    Array.isArray(d.lernplaene) &&
    Array.isArray(d.wochenplaene) &&
    Array.isArray(d.semester) &&
    typeof d.settings === 'object' &&
    d.settings !== null
  );
}

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const importState = useStore((s) => s.importState);
  const module = useStore((s) => s.module);
  const stundenplan = useStore((s) => s.stundenplan);
  const upsertBlock = useStore((s) => s.upsertBlock);
  const deleteBlock = useStore((s) => s.deleteBlock);
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [importFehler, setImportFehler] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bearbeiteBlockId, setBearbeiteBlockId] = useState<string | null>(null);
  const [neuerBlockAktiv, setNeuerBlockAktiv] = useState(false);

  const stundenplanSortiert = [...stundenplan].sort(
    (a, b) => a.wochentag - b.wochentag || blockStartMin(a) - blockStartMin(b),
  );

  const alleFaecher = Array.from(
    new Set([...module.map((m) => m.fach), ...stundenplan.map((b) => b.fach)].filter((f): f is string => !!f)),
  ).sort();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function exportieren() {
    const state: AppState = useStore.getState();
    const { module, lernplaene, wochenplaene, semester, stundenplan, settings: s } = state;
    const payload: AppState = { module, lernplaene, wochenplaene, semester, stundenplan, settings: s };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studium-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importDatei(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFehler('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!istGueltigerState(data)) throw new Error('invalid');
        if (confirm('Import ersetzt alle aktuellen Daten (Module, Lernpläne, Wochenpläne, Einstellungen). Fortfahren?')) {
          importState(data);
          setForm(data.settings);
        }
      } catch {
        setImportFehler('Ungültige Backup-Datei.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Einstellungen</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Grunddaten deines Studiums &ndash; Basis für ECTS-Fortschritt, Notenschnitt und Regelstudienzeit-Abgleich.
      </p>

      <form onSubmit={submit} className="mt-6 max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <Field label="Studiengang">
          <input
            className={inputClass}
            value={form.studiengang}
            onChange={(e) => setForm({ ...form, studiengang: e.target.value })}
          />
        </Field>
        <Field label="Hochschule">
          <input
            className={inputClass}
            value={form.hochschule}
            onChange={(e) => setForm({ ...form, hochschule: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gesamt-ECTS (Soll)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.gesamtEctsSoll}
              onChange={(e) => setForm({ ...form, gesamtEctsSoll: Number(e.target.value) })}
            />
          </Field>
          <Field label="Zielschnitt (optional)">
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              className={inputClass}
              value={form.zielschnitt ?? ''}
              onChange={(e) => setForm({ ...form, zielschnitt: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
        </div>
        <Field label="Regelstudienzeit-Ende">
          <input
            type="date"
            className={inputClass}
            value={form.regelstudienzeitEnde ?? ''}
            onChange={(e) => setForm({ ...form, regelstudienzeitEnde: e.target.value || null })}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--akzent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--akzent-hover)]"
          >
            Speichern
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Gespeichert.</span>}
        </div>
      </form>

      <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Design</div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Akzentfarbe für Buttons, Markierungen und Fortschrittsbalken.</p>
        <div className="flex flex-wrap gap-2">
          {AKZENT_OPTIONEN.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateSettings({ akzent: opt.id })}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                settings.akzent === opt.id
                  ? 'border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: opt.farbe }} />
              {opt.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Fach-Farben</div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Eigene Farbe pro Fach für den Zeitraster im Wochenplan. Ohne eigene Farbe wird nach Blockart
          eingefärbt (Lernblock, Vorlesung, Frei).
        </p>
        {alleFaecher.length ? (
          <div className="space-y-2">
            {alleFaecher.map((fach) => (
              <div key={fach} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{fach}</span>
                <input
                  type="color"
                  className="h-8 w-12 shrink-0 cursor-pointer rounded border border-slate-300 bg-transparent dark:border-slate-700"
                  value={settings.fachFarben[fach] ?? '#64748b'}
                  onChange={(e) => updateSettings({ fachFarben: { ...settings.fachFarben, [fach]: e.target.value } })}
                />
                {settings.fachFarben[fach] && (
                  <button
                    type="button"
                    onClick={() => {
                      const { [fach]: _entfernt, ...rest } = settings.fachFarben;
                      updateSettings({ fachFarben: rest });
                    }}
                    className="shrink-0 text-xs text-slate-400 hover:text-red-500"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Noch keine Fächer vorhanden &ndash; trage bei Modulen oder Stundenplan-Blöcken ein Fach ein.
          </p>
        )}
      </div>

      <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">A/B-Wochen</div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Legt fest, ob ungerade Kalenderwochen als Woche A oder Woche B gelten, und wie die beiden Wochen im
          Wochenplan beschriftet werden.
        </p>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!form.abWochen.aUngerade}
            onChange={(e) => setForm({ ...form, abWochen: { ...form.abWochen, aUngerade: !e.target.checked } })}
          />
          Woche A und B tauschen (aktuell: {form.abWochen.aUngerade ? 'ungerade KW = A' : 'ungerade KW = B'})
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Label Woche A">
            <input
              className={inputClass}
              value={form.abWochen.labelA}
              onChange={(e) => setForm({ ...form, abWochen: { ...form.abWochen, labelA: e.target.value } })}
            />
          </Field>
          <Field label="Label Woche B">
            <input
              className={inputClass}
              value={form.abWochen.labelB}
              onChange={(e) => setForm({ ...form, abWochen: { ...form.abWochen, labelB: e.target.value } })}
            />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              updateSettings(form);
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            }}
            className="rounded-lg bg-[var(--akzent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--akzent-hover)]"
          >
            Speichern
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Gespeichert.</span>}
        </div>
      </div>

      <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Stundenplan</div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Feste Vorlesungen, Lernblöcke und freie Zeiten für den Zeitraster im Wochenplan.
        </p>
        <div className="space-y-2">
          {stundenplanSortiert.map((block) =>
            bearbeiteBlockId === block.id ? (
              <BlockForm
                key={block.id}
                initial={block}
                module={module}
                onSubmit={(b) => {
                  upsertBlock(b);
                  setBearbeiteBlockId(null);
                }}
                onAbbrechen={() => setBearbeiteBlockId(null)}
              />
            ) : (
              <div
                key={block.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
              >
                <div className="min-w-0 break-words">
                  <div className="font-semibold">
                    {WOCHENTAGE_LABEL[block.wochentag]} {block.start}&ndash;{block.ende} &middot; {block.titel}
                  </div>
                  <div className="text-xs text-slate-400">
                    {ART_LABEL[block.art]} &middot; {WOCHEN_LABEL[block.wochen]}
                    {block.fach && ` · ${block.fach}`}
                    {block.modulId && ` · ${module.find((m) => m.id === block.modulId)?.kuerzel ?? ''}`}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setBearbeiteBlockId(block.id)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => confirm(`"${block.titel}" wirklich löschen?`) && deleteBlock(block.id)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-red-500 hover:border-red-400 dark:border-slate-700"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ),
          )}
          {!stundenplanSortiert.length && <p className="text-sm text-slate-400">Noch keine Stundenplan-Blöcke angelegt.</p>}
        </div>

        <div className="mt-3">
          {neuerBlockAktiv ? (
            <BlockForm
              initial={neuerBlock()}
              module={module}
              onSubmit={(b) => {
                upsertBlock(b);
                setNeuerBlockAktiv(false);
              }}
              onAbbrechen={() => setNeuerBlockAktiv(false)}
            />
          ) : (
            <button
              onClick={() => setNeuerBlockAktiv(true)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              + Neuer Block
            </button>
          )}
        </div>
      </div>

      <TabellenImport bestehendeKuerzel={new Set(module.map((m) => m.kuerzel))} />

      <StundenplanTabellenImport />

      <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Backup</div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Alle Daten liegen nur in diesem Browser (localStorage). Exportiere regelmäßig ein Backup,
          damit bei Cache-Löschung oder Browserwechsel nichts verloren geht.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportieren}
            className="rounded-lg bg-[var(--akzent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--akzent-hover)]"
          >
            &darr; Als JSON exportieren
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            &uarr; JSON importieren
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importDatei} />
        </div>
        {importFehler && <p className="mt-2 text-sm text-red-500">{importFehler}</p>}
      </div>
    </div>
  );
}
