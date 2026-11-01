import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';
import { entryTimestamp, toInputDate } from '../lib/dates.js';
import { previewEntry } from '../lib/calc.js';
import { formatMoney, formatTime } from '../lib/format.js';

/**
 * Modal for editing an existing entry. Bottom sheet on mobile, centered on larger screens.
 * onSaved receives the updated entry from the API.
 */
export default function EntryEditDialog({ entry, workers, gardens, fruitTypes, onClose, onSaved }) {
  const today = toInputDate(new Date());
  const originalDate = toInputDate(entry.createdAt);
  const [form, setForm] = useState({
    workerId: String(entry.workerId),
    gardenId: String(entry.gardenId),
    fruitTypeId: String(entry.fruitTypeId),
    kg: String(entry.kg),
    boxes: String(entry.boxes),
    date: originalDate,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Same fruit: the server keeps the entry's original rates
  const keepsSnapshotRates = form.fruitTypeId === String(entry.fruitTypeId);
  const rates = keepsSnapshotRates
    ? { pricePerKg: entry.pricePerKgSnapshot, discountPerBox: entry.discountPerBoxSnapshot }
    : fruitTypes.find((f) => String(f.id) === form.fruitTypeId);
  const preview = previewEntry(form, rates);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        workerId: Number(form.workerId),
        gardenId: Number(form.gardenId),
        fruitTypeId: Number(form.fruitTypeId),
        kg: Number(form.kg) || 0,
        boxes: Number(form.boxes) || 0,
      };
      // Moving to another day keeps the original time of day
      if (form.date !== originalDate) {
        payload.createdAt = entryTimestamp(form.date, entry.createdAt).toISOString();
      }
      const { data } = await api.put(`/entries/${entry.id}`, payload);
      onSaved(data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el registro.'));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center sm:p-4 print:hidden"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-entry-title"
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-entry-title" className="text-lg font-bold">Editar registro</h2>
            <p className="text-xs text-gray-500">Registrado a las {formatTime(entry.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div>
          <label className="label" htmlFor="edit-workerId">Trabajador</label>
          <select id="edit-workerId" className="input" value={form.workerId} onChange={update('workerId')} required>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.group?.name})</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="edit-gardenId">Huerto</label>
            <select id="edit-gardenId" className="input" value={form.gardenId} onChange={update('gardenId')} required>
              {gardens.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="edit-fruitTypeId">Fruta</label>
            <select id="edit-fruitTypeId" className="input" value={form.fruitTypeId} onChange={update('fruitTypeId')} required>
              {fruitTypes.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3">
          <div>
            <label className="label" htmlFor="edit-kg">Kilos</label>
            <input id="edit-kg" type="number" inputMode="decimal" min="0" step="any" className="input"
              value={form.kg} onChange={update('kg')} placeholder="0" />
          </div>
          <div>
            <label className="label" htmlFor="edit-boxes">Cajas</label>
            <input id="edit-boxes" type="number" inputMode="numeric" min="0" step="1" className="input"
              value={form.boxes} onChange={update('boxes')} placeholder="0" />
          </div>
          <div>
            <label className="label" htmlFor="edit-date">Fecha</label>
            <input id="edit-date" type="date" className="input w-auto" value={form.date} max={today}
              onChange={(e) => e.target.value && e.target.value <= today && setForm({ ...form, date: e.target.value })}
              required />
          </div>
        </div>

        {preview && (
          <div className={`rounded-lg px-3 py-2 text-sm ${preview.invalid ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
            <div className="flex justify-between"><span>Valor fruta</span><span>{formatMoney(preview.fruitValue)}</span></div>
            <div className="flex justify-between"><span>Descuento cajas</span><span>− {formatMoney(preview.boxDiscount)}</span></div>
            <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 text-base font-bold">
              <span>Total a pagar</span><span>{formatMoney(preview.total)}</span>
            </div>
            {preview.invalid && <p className="mt-1">El descuento por cajas supera el valor de la fruta.</p>}
            {keepsSnapshotRates && (
              <p className="mt-1 text-xs text-gray-500">Se mantienen los precios del registro original.</p>
            )}
          </div>
        )}

        {error && <p className="alert-error">{error}</p>}

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 py-3" onClick={onClose}>Cancelar</button>
          <button
            type="submit"
            className="btn-primary flex-1 py-3"
            disabled={saving || !(Number(form.kg) > 0) || preview?.invalid}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
