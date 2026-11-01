import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { addDays, fromInputDate, toInputDate } from '../lib/dates.js';
import { formatLongDate, formatMoney, formatNumber } from '../lib/format.js';
import { useCatalog } from '../lib/useCatalog.js';
import EntryRow from '../components/EntryRow.jsx';
import EntryEditDialog from '../components/EntryEditDialog.jsx';

export default function WorkerDetailPage() {
  const workerId = Number(useParams().id);
  const { gardens, workers, fruitTypes, loading: catalogLoading } = useCatalog();
  const [entries, setEntries] = useState([]);
  // Empty range = all entries for this worker
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);

  const worker = workers.find((w) => w.id === workerId);
  const rangeError = from && to && to < from ? '“Hasta” debe ser igual o posterior a “Desde”.' : '';

  useEffect(() => {
    if (rangeError) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = { workerId };
    if (from) params.from = fromInputDate(from).toISOString();
    if (to) params.to = addDays(fromInputDate(to), 1).toISOString();
    api
      .get('/entries', { params })
      .then(({ data }) => !cancelled && setEntries(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'No se pudieron cargar los registros.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [workerId, from, to, rangeError]);

  // Newest day first, entries already sorted newest first by the API
  const days = useMemo(() => {
    const map = new Map();
    for (const entry of entries) {
      const key = toInputDate(entry.createdAt);
      if (!map.has(key)) map.set(key, { key, entries: [], total: 0 });
      const day = map.get(key);
      day.entries.push(entry);
      day.total += entry.totalPaid;
    }
    return [...map.values()];
  }, [entries]);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({ kg: acc.kg + e.kg, paid: acc.paid + e.totalPaid }),
        { kg: 0, paid: 0 }
      ),
    [entries]
  );

  function isInRange(entry) {
    const day = toInputDate(entry.createdAt);
    return (!from || day >= from) && (!to || day <= to);
  }

  function handleEdited(updated) {
    const stays = updated.workerId === workerId && isInRange(updated);
    setEntries((prev) => {
      const rest = prev.filter((x) => x.id !== updated.id);
      if (!stays) return rest;
      return [...rest, updated].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    setSuccess(
      updated.workerId !== workerId
        ? `Registro reasignado a ${updated.worker.name}.`
        : `Registro actualizado — ${formatMoney(updated.totalPaid)}`
    );
    setEditingEntry(null);
  }

  async function handleDelete(entry) {
    const when = formatLongDate(entry.createdAt);
    if (!window.confirm(`¿Eliminar el registro del ${when} por ${formatMoney(entry.totalPaid)}?`)) return;
    try {
      await api.delete(`/entries/${entry.id}`);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      setSuccess('Registro eliminado.');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el registro.'));
    }
  }

  if (catalogLoading) return <p className="py-10 text-center text-gray-500">Cargando…</p>;
  if (!worker) {
    return (
      <div className="space-y-4">
        <Link to="/trabajadores" className="text-sm font-medium text-brand-700">‹ Trabajadores</Link>
        <p className="card text-center text-sm text-gray-500">Trabajador no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/trabajadores" className="text-sm font-medium text-brand-700">‹ Trabajadores</Link>

      <div className="card">
        <h1 className="text-xl font-bold">{worker.name}</h1>
        <p className="text-sm text-gray-500">
          {worker.group?.name}
          {worker.rut ? ` · RUT ${worker.rut}` : ''}
        </p>
      </div>

      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="worker-from">Desde</label>
            <input id="worker-from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="worker-to">Hasta</label>
            <input id="worker-to" type="date" className="input" value={to} min={from || undefined}
              onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {rangeError ? (
          <p className="alert-error">{rangeError}</p>
        ) : (
          (from || to) && (
            <button className="text-sm font-medium text-brand-700 underline" onClick={() => { setFrom(''); setTo(''); }}>
              Ver todos los registros
            </button>
          )
        )}
      </div>

      {!loading && !rangeError && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3">
            <p className="text-xs uppercase text-gray-500">Total</p>
            <p className="text-lg font-bold text-brand-800">{formatMoney(totals.paid)}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs uppercase text-gray-500">Kilos</p>
            <p className="text-lg font-bold">{formatNumber(totals.kg)}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs uppercase text-gray-500">Registros</p>
            <p className="text-lg font-bold">{entries.length}</p>
          </div>
        </div>
      )}

      {success && <p className="alert-success">{success}</p>}
      {error && <p className="alert-error">{error}</p>}

      {loading ? (
        <p className="text-center text-sm text-gray-500">Cargando…</p>
      ) : !rangeError && entries.length === 0 ? (
        <p className="card text-center text-sm text-gray-500">
          {from || to ? 'No hay registros en este período.' : 'Este trabajador aún no tiene registros.'}
        </p>
      ) : (
        days.map((day) => (
          <section key={day.key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 px-1">
              <h2 className="font-semibold capitalize">{formatLongDate(fromInputDate(day.key))}</h2>
              <span className="text-sm font-semibold text-brand-800">{formatMoney(day.total)}</span>
            </div>
            <ul className="space-y-2">
              {day.entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} showWorker={false} onEdit={setEditingEntry} onDelete={handleDelete} />
              ))}
            </ul>
          </section>
        ))
      )}

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
