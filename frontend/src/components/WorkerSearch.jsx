import { forwardRef, useMemo, useState } from 'react';
import { matchesWorker } from '../lib/search.js';

const WorkerSearch = forwardRef(function WorkerSearch({ workers, onSelect }, inputRef) {
  const [query, setQuery] = useState('');

  const matches = useMemo(
    () => workers.filter((w) => matchesWorker(query, { name: w.name, groupName: w.group?.name, rut: w.rut })),
    [workers, query]
  );

  function select(worker) {
    setQuery('');
    onSelect(worker);
  }

  function handleKeyDown(e) {
    // Enter picks the only/first match for fast keyboard entry
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query && matches.length > 0) select(matches[0]);
    }
  }

  return (
    <div className="space-y-2">
      <label className="label" htmlFor="worker-search">Buscar trabajador</label>
      <input
        id="worker-search"
        ref={inputRef}
        type="search"
        className="input"
        placeholder="Nombre, RUT o grupo…"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {matches.length === 0 ? (
        <p className="py-3 text-center text-sm text-gray-500">Ningún trabajador coincide con “{query}”.</p>
      ) : (
        <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg ring-1 ring-gray-200">
          {matches.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => select(w)}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-brand-50 active:bg-brand-100"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{w.name}</span>
                  <span className="block text-xs text-gray-500">
                    {w.group?.name}
                    {w.rut ? ` · ${w.rut}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-brand-700">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default WorkerSearch;
