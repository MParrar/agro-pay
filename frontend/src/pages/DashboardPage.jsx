import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { addDays, entryTimestamp, fromInputDate, toInputDate } from '../lib/dates.js';
import { previewEntry } from '../lib/calc.js';
import { formatLongDate, formatMoney, formatNumber } from '../lib/format.js';
import { useCatalog } from '../lib/useCatalog.js';
import WorkerSearch from '../components/WorkerSearch.jsx';
import EntryRow from '../components/EntryRow.jsx';
import EntryEditDialog from '../components/EntryEditDialog.jsx';

const DEFAULT_GARDEN_NAME = 'la dehesa';
const EMPTY_QUANTITIES = { kg: '', boxes: '' };

export default function DashboardPage() {
  const { gardens, workers, fruitTypes, loading, error: catalogError } = useCatalog();
  const [entries, setEntries] = useState([]);

  const today = toInputDate(new Date());
  const [date, setDate] = useState(today);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [form, setForm] = useState({ gardenId: '', fruitTypeId: '', ...EMPTY_QUANTITIES });
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchRef = useRef(null);
  const kgRef = useRef(null);
  const isToday = date === today;

  const loadEntries = useCallback(async (dateValue) => {
    const from = fromInputDate(dateValue);
    const { data } = await api.get('/entries', {
      params: { from: from.toISOString(), to: addDays(from, 1).toISOString() },
    });
    setEntries(data);
  }, []);

  // Default garden and fruit once the catalog arrives
  useEffect(() => {
    const defaultGarden = gardens.find((g) => g.name.toLowerCase() === DEFAULT_GARDEN_NAME) ?? gardens[0];
    setForm((prev) => ({
      ...prev,
      gardenId: prev.gardenId || (defaultGarden ? String(defaultGarden.id) : ''),
      fruitTypeId: prev.fruitTypeId || (fruitTypes.length === 1 ? String(fruitTypes[0].id) : ''),
    }));
  }, [gardens, fruitTypes]);

  useEffect(() => {
    loadEntries(date).catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los registros.')));
  }, [date, loadEntries]);

  useEffect(() => {
    if (selectedWorker) kgRef.current?.focus();
  }, [selectedWorker]);

  const selectedFruit = fruitTypes.find((f) => String(f.id) === form.fruitTypeId);
  const preview = previewEntry(form, selectedFruit);
  const hasQuantity = Number(form.kg) > 0;

  const dayTotal = useMemo(() => entries.reduce((sum, e) => sum + e.totalPaid, 0), [entries]);
  const workerDayEntries = selectedWorker ? entries.filter((e) => e.workerId === selectedWorker.id) : [];
  const workerDayTotal = workerDayEntries.reduce((sum, e) => sum + e.totalPaid, 0);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function selectWorker(worker) {
    setError('');
    setSuccess('');
    setSelectedWorker(worker);
  }

  function clearWorker() {
    setSelectedWorker(null);
    setForm((prev) => ({ ...prev, ...EMPTY_QUANTITIES }));
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function handleDateChange(e) {
    const value = e.target.value;
    // Ignore cleared or future dates
    if (value && value <= today) setDate(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await api.post('/entries', {
        gardenId: Number(form.gardenId),
        workerId: selectedWorker.id,
        fruitTypeId: Number(form.fruitTypeId),
        kg: Number(form.kg) || 0,
        boxes: Number(form.boxes) || 0,
        ...(isToday ? {} : { createdAt: entryTimestamp(date).toISOString() }),
      });
      setEntries((prev) => [data, ...prev]);
      setSuccess(`Registrado: ${data.worker.name} — ${formatMoney(data.totalPaid)}`);
      // Keep date, garden and fruit; go back to search for the next worker
      clearWorker();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el registro.'));
    } finally {
      setSaving(false);
    }
  }

  function handleEdited(updated) {
    const stillInView = toInputDate(updated.createdAt) === date;
    setEntries((prev) =>
      stillInView ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev.filter((x) => x.id !== updated.id)
    );
    setSuccess(
      stillInView
        ? `Actualizado: ${updated.worker.name} — ${formatMoney(updated.totalPaid)}`
        : `Actualizado y movido al ${formatLongDate(updated.createdAt)}: ${updated.worker.name}`
    );
    setEditingEntry(null);
  }

  async function handleDelete(entry) {
    if (!window.confirm(`¿Eliminar el registro de ${entry.worker.name} por ${formatMoney(entry.totalPaid)}?`)) return;
    try {
      await api.delete(`/entries/${entry.id}`);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el registro.'));
    }
  }

  if (loading) return <p className="py-10 text-center text-gray-500">Cargando…</p>;

  const missingCatalog = workers.length === 0 || fruitTypes.length === 0 || gardens.length === 0;
  const dayLabel = isToday ? 'de hoy' : `del ${formatLongDate(fromInputDate(date))}`;
  const pageError = error || catalogError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Registro diario</h1>
        <p className="text-sm capitalize text-gray-500">{formatLongDate(fromInputDate(date))}</p>
      </div>

      {!isToday && (
        <p className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          <span>Está registrando entregas para un día anterior.</span>
          <button className="shrink-0 font-semibold underline" onClick={() => setDate(today)}>Volver a hoy</button>
        </p>
      )}

      {missingCatalog && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Para registrar entregas necesita al menos un huerto, un trabajador y un tipo de fruta.{' '}
          <Link to="/ajustes" className="font-semibold underline">Ir a Ajustes</Link>
        </p>
      )}

      {success && !selectedWorker && <p className="alert-success">{success}</p>}

      {!selectedWorker ? (
        <div className="card">
          <WorkerSearch ref={searchRef} workers={workers} onSelect={selectWorker} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-start justify-between gap-3 rounded-lg bg-brand-50 p-3 ring-1 ring-brand-100">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-brand-700">Trabajador</p>
              <p className="truncate text-lg font-bold">{selectedWorker.name}</p>
              <p className="text-xs text-gray-600">
                {selectedWorker.group?.name}
                {selectedWorker.rut ? ` · RUT ${selectedWorker.rut}` : ''}
              </p>
              {workerDayEntries.length > 0 && (
                <p className="mt-1 text-xs text-gray-600">
                  Registros {dayLabel}: {workerDayEntries.length} · {formatMoney(workerDayTotal)}
                </p>
              )}
            </div>
            <button type="button" className="btn-secondary shrink-0 px-3 py-1.5" onClick={clearWorker}>
              Cambiar
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="gardenId">Huerto</label>
              <select id="gardenId" className="input" value={form.gardenId} onChange={update('gardenId')} required>
                <option value="">Seleccione…</option>
                {gardens.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="fruitTypeId">Fruta</label>
              <select id="fruitTypeId" className="input" value={form.fruitTypeId} onChange={update('fruitTypeId')} required>
                <option value="">Seleccione…</option>
                {fruitTypes.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date keeps its natural width; kilos and boxes share the rest */}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3">
            <div>
              <label className="label" htmlFor="kg">Kilos</label>
              <input id="kg" ref={kgRef} type="number" inputMode="decimal" min="0" step="any" className="input"
                value={form.kg} onChange={update('kg')} placeholder="0" />
            </div>
            <div>
              <label className="label" htmlFor="boxes">Cajas</label>
              <input id="boxes" type="number" inputMode="numeric" min="0" step="1" className="input"
                value={form.boxes} onChange={update('boxes')} placeholder="0" />
            </div>
            <div>
              <label className="label" htmlFor="entry-date">Fecha</label>
              <input id="entry-date" type="date" className="input w-auto" value={date} max={today}
                onChange={handleDateChange} required />
            </div>
          </div>

          {preview && (
            <div className={`rounded-lg px-3 py-2 text-sm ${preview.invalid ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
              <div className="flex justify-between"><span>Kg bruto</span><span>{formatNumber(preview.grossKg)} kg</span></div>
              <div className="flex justify-between"><span>Descuento cajas</span><span>− {formatNumber(preview.boxKg)} kg</span></div>
              <div className="flex justify-between"><span>Kg neto</span><span>{formatNumber(preview.netKg)} kg</span></div>
              <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 text-base font-bold">
                <span>Total a pagar</span><span>{formatMoney(preview.total)}</span>
              </div>
              {preview.invalid && <p className="mt-1">Los kilos descontados por cajas superan los kilos entregados.</p>}
            </div>
          )}

          {error && <p className="alert-error">{error}</p>}

          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={saving || missingCatalog || !hasQuantity || preview?.invalid}
          >
            {saving ? 'Guardando…' : 'Guardar registro'}
          </button>
        </form>
      )}

      {pageError && !selectedWorker && <p className="alert-error">{pageError}</p>}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Registros {dayLabel} ({entries.length})</h2>
          <span className="shrink-0 text-sm font-semibold text-brand-800">{formatMoney(dayTotal)}</span>
        </div>

        {entries.length === 0 ? (
          <p className="card text-center text-sm text-gray-500">No hay registros para este día.</p>
        ) : (
          <ul className="-m-1 max-h-96 space-y-2 overflow-y-auto overscroll-contain p-1">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onEdit={setEditingEntry} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </section>

      {editingEntry && (
        <EntryEditDialog
          entry={editingEntry}
          workers={workers}
          gardens={gardens}
          fruitTypes={fruitTypes}
          onClose={() => setEditingEntry(null)}
          onSaved={handleEdited}
        />
      )}
    </div>
  );
}
