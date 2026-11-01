import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';

/**
 * Generic list + create/edit form for a REST resource.
 * fields: [{ name, label, type: 'text'|'number'|'select', required, options: [{value,label}], placeholder }]
 * renderItem: (item) => JSX summary for the list row
 * toPayload: (formValues) => request body
 * toForm: (item) => form values for editing
 * newLabel: heading for the create form (Spanish gender agreement varies, e.g. "Nueva fruta")
 */
export default function CrudSection({ title, newLabel, endpoint, fields, renderItem, toPayload, toForm, emptyMessage }) {
  const emptyForm = Object.fromEntries(fields.map((f) => [f.name, '']));
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(endpoint);
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los datos.'));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(item) {
    setError('');
    setEditingId(item.id);
    setForm(toForm(item));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) await api.put(`${endpoint}/${editingId}`, payload);
      else await api.post(endpoint, payload);
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return;
    setError('');
    try {
      await api.delete(`${endpoint}/${item.id}`);
      if (editingId === item.id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar.'));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card space-y-3">
        <h2 className="font-semibold">{editingId ? `Editar ${title.toLowerCase()}` : newLabel}</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="label" htmlFor={`${endpoint}-${field.name}`}>
                {field.label}
                {!field.required && <span className="font-normal text-gray-400"> (opcional)</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  id={`${endpoint}-${field.name}`}
                  className="input"
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required}
                >
                  <option value="">Seleccione…</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${endpoint}-${field.name}`}
                  className="input"
                  type={field.type === 'number' ? 'number' : 'text'}
                  inputMode={field.type === 'number' ? 'decimal' : undefined}
                  min={field.type === 'number' ? '0' : undefined}
                  step={field.type === 'number' ? 'any' : undefined}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="alert-error">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-center text-sm text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="card text-center text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`card flex items-center justify-between gap-3 p-3 ${editingId === item.id ? 'ring-2 ring-brand-600' : ''}`}
            >
              <div className="min-w-0">{renderItem(item)}</div>
              <div className="flex shrink-0 gap-2">
                <button className="btn-secondary px-3 py-1.5" onClick={() => startEdit(item)}>Editar</button>
                <button className="btn-danger px-3 py-1.5" onClick={() => handleDelete(item)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
