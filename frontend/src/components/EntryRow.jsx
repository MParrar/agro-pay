import { formatMoney, formatNumber, formatTime } from '../lib/format.js';

// One entry in a list, with edit and delete actions. showWorker=false hides the name (worker detail page).
export default function EntryRow({ entry, onEdit, onDelete, showWorker = true }) {
  return (
    <li className="card flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        {showWorker && <p className="truncate font-semibold">{entry.worker.name}</p>}
        <p className={showWorker ? 'text-xs text-gray-500' : 'text-sm font-medium'}>
          {formatTime(entry.createdAt)} · {entry.fruitType.name} · {entry.garden.name}
        </p>
        <p className="text-xs text-gray-600">
          {formatNumber(entry.kg)} kg · {entry.boxes} cajas
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-bold">{formatMoney(entry.totalPaid)}</span>
        <button
          onClick={() => onEdit(entry)}
          className="btn-secondary px-2.5 py-1.5"
          aria-label={`Editar registro de ${entry.worker.name}`}
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(entry)}
          className="btn-danger px-2.5 py-1.5"
          aria-label={`Eliminar registro de ${entry.worker.name}`}
        >
          🗑
        </button>
      </div>
    </li>
  );
}
