import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';

// Shows the worker's group with an inline "Cambiar" to move them to another group
export default function WorkerGroupEditor({ worker, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(String(worker.groupId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api
      .get('/groups')
      .then(({ data }) => setGroups(data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los grupos.')));
  }, [editing]);

  function startEditing() {
    setGroupId(String(worker.groupId));
    setError('');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // The API updates the whole worker, so send the current name and RUT along
      const { data } = await api.put(`/workers/${worker.id}`, {
        name: worker.name,
        rut: worker.rut,
        groupId: Number(groupId),
      });
      onSaved(data);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar el grupo.'));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Grupo: <span className="font-medium text-gray-900">{worker.group?.name}</span>
        </span>
        <button className="text-sm font-medium text-brand-700 underline" onClick={startEditing}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="label" htmlFor="worker-group">Grupo</label>
      <div className="flex gap-2">
        <select
          id="worker-group"
          className="input flex-1"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          disabled={groups.length === 0}
        >
          {groups.length === 0 && <option value={groupId}>Cargando…</option>}
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || groups.length === 0 || groupId === String(worker.groupId)}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
          Cancelar
        </button>
      </div>
      {error && <p className="alert-error">{error}</p>}
    </div>
  );
}
