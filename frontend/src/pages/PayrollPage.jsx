import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { api, getErrorMessage } from '../api/client.js';
import { addDays, fromInputDate, startOfWeek, toInputDate } from '../lib/dates.js';
import { formatDate, formatMoney, formatNumber } from '../lib/format.js';
import Payslip from '../components/Payslip.jsx';
import { matchesWorker } from '../lib/search.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 31; // matches the API limit

const TABS = [
  { id: 'workers', label: 'Trabajadores' },
  { id: 'groups', label: 'Grupos' },
  { id: 'gardens', label: 'Huertos' },
];

function sumRows(rows) {
  return rows.reduce(
    (t, r) => ({
      totalKg: t.totalKg + r.totalKg,
      totalBoxes: t.totalBoxes + r.totalBoxes,
      totalNetKg: t.totalNetKg + r.totalNetKg,
      totalPaid: t.totalPaid + r.totalPaid,
    }),
    { totalKg: 0, totalBoxes: 0, totalNetKg: 0, totalPaid: 0 }
  );
}

// On screen it scrolls inside itself with a sticky header; printed it shows every row
function TotalsTable({ rows, firstColumn, extraColumn, printed = false }) {
  const th = `${printed ? '' : 'sticky top-0'} bg-gray-50 px-4 py-2`;
  const totals = sumRows(rows);
  return (
    <section className="card overflow-hidden p-0">
      <div className={printed ? '' : 'max-h-96 overflow-auto overscroll-contain'}>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase text-gray-500">
            <tr>
              <th className={th}>{firstColumn}</th>
              {extraColumn && <th className={th}>{extraColumn.label}</th>}
              <th className={`${th} text-right`}>Kg Bruto</th>
              <th className={`${th} text-right`}>Cajas</th>
              <th className={`${th} text-right`}>Kg Neto</th>
              <th className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-2 font-medium">{row.name}</td>
                {extraColumn && <td className="px-4 py-2 text-gray-600">{extraColumn.render(row)}</td>}
                <td className="px-4 py-2 text-right">{formatNumber(row.totalKg)}</td>
                <td className="px-4 py-2 text-right">{row.totalBoxes}</td>
                <td className="px-4 py-2 text-right">{formatNumber(row.totalNetKg)}</td>
                <td className="px-4 py-2 text-right font-semibold">{formatMoney(row.totalPaid)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-300 font-semibold">
            <tr>
              <td className="px-4 py-2" colSpan={extraColumn ? 2 : 1}>Total</td>
              <td className="px-4 py-2 text-right">{formatNumber(totals.totalKg)}</td>
              <td className="px-4 py-2 text-right">{totals.totalBoxes}</td>
              <td className="px-4 py-2 text-right">{formatNumber(totals.totalNetKg)}</td>
              <td className="px-4 py-2 text-right">{formatMoney(totals.totalPaid)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default function PayrollPage() {
  const [from, setFrom] = useState(() => toInputDate(startOfWeek()));
  const [to, setTo] = useState(() => toInputDate(addDays(startOfWeek(), 6)));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onePerPage, setOnePerPage] = useState(false);
  const [tab, setTab] = useState('workers');
  const [workerQuery, setWorkerQuery] = useState('');
  // What window.print() puts on paper: every payslip, or the current tab's table
  const [printMode, setPrintMode] = useState('payslips');

  const rangeStart = fromInputDate(from);
  const rangeEnd = addDays(fromInputDate(to), 1); // exclusive
  const rangeDays = Math.round((rangeEnd - rangeStart) / DAY_MS);
  const rangeError =
    rangeDays < 1 ? '“Hasta” debe ser igual o posterior a “Desde”.'
    : rangeDays > MAX_RANGE_DAYS ? `El rango no puede superar ${MAX_RANGE_DAYS} días.`
    : '';

  useEffect(() => {
    if (rangeError) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/payroll/weekly', {
        params: { start: fromInputDate(from).toISOString(), end: addDays(fromInputDate(to), 1).toISOString() },
      })
      .then(({ data }) => !cancelled && setData(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'No se pudo cargar la planilla.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to, rangeError]);

  // Moves the whole range by its own length (a week by default)
  function shiftRange(direction) {
    const days = rangeDays * direction;
    setFrom(toInputDate(addDays(rangeStart, days)));
    setTo(toInputDate(addDays(rangeEnd, days - 1)));
  }

  function showCurrentWeek() {
    setFrom(toInputDate(startOfWeek()));
    setTo(toInputDate(addDays(startOfWeek(), 6)));
  }

  const hasData = data && data.workers.length > 0;
  const filteredWorkers = hasData ? data.workers.filter((w) => matchesWorker(workerQuery, w)) : [];

  const tabTables = hasData && {
    workers: {
      firstColumn: 'Trabajador',
      extraColumn: { label: 'Grupo', render: (r) => r.groupName },
      rows: filteredWorkers.map((w) => ({ ...w, key: w.workerId })),
    },
    groups: {
      firstColumn: 'Grupo',
      extraColumn: { label: 'Trab.', render: (r) => r.workerCount },
      rows: data.byGroup.map((g) => ({ ...g, key: g.groupId })),
    },
    gardens: {
      firstColumn: 'Huerto',
      rows: data.byGarden.map((g) => ({ ...g, key: g.gardenId })),
    },
  };
  const currentTable = tabTables && tabTables[tab];

  // Render the chosen print layout before the print dialog takes its snapshot
  function print(mode) {
    flushSync(() => setPrintMode(mode));
    window.print();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 print:hidden">
        <h1 className="text-xl font-bold">Planilla</h1>

        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="range-from">Desde</label>
              <input
                id="range-from"
                type="date"
                className="input"
                value={from}
                onChange={(e) => e.target.value && setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="range-to">Hasta</label>
              <input
                id="range-to"
                type="date"
                className="input"
                value={to}
                min={from}
                onChange={(e) => e.target.value && setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button className="btn-secondary px-3 py-1.5" onClick={() => shiftRange(-1)} disabled={Boolean(rangeError)}>‹ Anterior</button>
            <button className="text-sm font-medium text-brand-700 underline" onClick={showCurrentWeek}>
              Esta semana
            </button>
            <button className="btn-secondary px-3 py-1.5" onClick={() => shiftRange(1)} disabled={Boolean(rangeError)}>Siguiente ›</button>
          </div>

          {rangeError ? (
            <p className="alert-error">{rangeError}</p>
          ) : (
            <p className="text-center text-sm text-gray-600">
              {rangeDays} {rangeDays === 1 ? 'día' : 'días'}: {formatDate(rangeStart)} — {formatDate(addDays(rangeEnd, -1))}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-700"
                checked={onePerPage}
                onChange={(e) => setOnePerPage(e.target.checked)}
              />
              Una liquidación por página
            </label>
            <button className="btn-primary" onClick={() => print('payslips')} disabled={!hasData}>
              🖨 Imprimir liquidaciones
            </button>
          </div>
        </div>

        {error && <p className="alert-error">{error}</p>}
        {loading && <p className="text-center text-sm text-gray-500">Cargando…</p>}

        {!loading && data && !hasData && (
          <p className="card text-center text-sm text-gray-500">No hay registros en este período.</p>
        )}

        {!loading && hasData && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="card">
                <p className="text-xs uppercase text-gray-500">Total período</p>
                <p className="text-2xl font-bold text-brand-800">{formatMoney(data.grandTotal.totalPaid)}</p>
              </div>
              <div className="card">
                <p className="text-xs uppercase text-gray-500">Trabajadores</p>
                <p className="text-2xl font-bold">{data.workers.length}</p>
                <p className="text-xs text-gray-500">{formatNumber(data.grandTotal.totalNetKg)} kg neto</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="inline-flex gap-1 rounded-lg bg-gray-200 p-1">
                  {TABS.map((t) => {
                    const count = { workers: data.workers, groups: data.byGroup, gardens: data.byGarden }[t.id].length;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                          tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        {t.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                className="btn-secondary shrink-0 self-end px-3 py-1.5 sm:self-auto"
                onClick={() => print('table')}
                disabled={currentTable.rows.length === 0}
              >
                🖨 Imprimir tabla
              </button>
            </div>

            {tab === 'workers' && (
              <>
                <input
                  type="search"
                  className="input"
                  placeholder="Buscar trabajador por nombre, RUT o grupo…"
                  aria-label="Buscar trabajador"
                  autoComplete="off"
                  value={workerQuery}
                  onChange={(e) => setWorkerQuery(e.target.value)}
                />
                {filteredWorkers.length === 0 ? (
                  <p className="card text-center text-sm text-gray-500">
                    Ningún trabajador coincide con “{workerQuery}”.
                  </p>
                ) : (
                  <TotalsTable {...currentTable} />
                )}
              </>
            )}
            {tab !== 'workers' && <TotalsTable {...currentTable} />}
          </>
        )}
      </div>

      {/* Current tab's table: only rendered on paper */}
      {hasData && printMode === 'table' && (
        <div className="hidden space-y-3 print:block">
          <div>
            <h1 className="text-lg font-bold">Planilla — {TABS.find((t) => t.id === tab).label}</h1>
            <p className="text-sm">
              Período del {formatDate(rangeStart)} al {formatDate(addDays(rangeEnd, -1))}
              {tab === 'workers' && workerQuery && ` · Búsqueda: “${workerQuery}”`}
            </p>
          </div>
          <TotalsTable {...currentTable} printed />
        </div>
      )}

      {/* Payslips: only rendered on paper */}
      {hasData && printMode === 'payslips' && (
        <div className="hidden print:block">
          {data.workers.map((worker, i) => (
            <Payslip
              key={worker.workerId}
              worker={worker}
              start={data.start}
              end={data.end}
              pageBreak={onePerPage && i < data.workers.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
