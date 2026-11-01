import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';
import { addDays, fromInputDate, startOfWeek, toInputDate } from '../lib/dates.js';
import { formatDate, formatMoney, formatNumber } from '../lib/format.js';
import Payslip from '../components/Payslip.jsx';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 31; // matches the API limit

function TotalsTable({ title, rows, firstColumn, extraColumn }) {
  return (
    <section className="card overflow-hidden p-0">
      <h2 className="border-b border-gray-200 px-4 py-3 font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">{firstColumn}</th>
              {extraColumn && <th className="px-4 py-2">{extraColumn.label}</th>}
              <th className="px-4 py-2 text-right">Kg</th>
              <th className="px-4 py-2 text-right">Cajas</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-2 font-medium">{row.name}</td>
                {extraColumn && <td className="px-4 py-2 text-gray-600">{extraColumn.render(row)}</td>}
                <td className="px-4 py-2 text-right">{formatNumber(row.totalKg)}</td>
                <td className="px-4 py-2 text-right">{row.totalBoxes}</td>
                <td className="px-4 py-2 text-right font-semibold">{formatMoney(row.totalPaid)}</td>
              </tr>
            ))}
          </tbody>
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
            <button className="btn-primary" onClick={() => window.print()} disabled={!hasData}>
              🖨 Imprimir / Guardar PDF
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
                <p className="text-xs text-gray-500">{formatNumber(data.grandTotal.totalKg)} kg</p>
              </div>
            </div>

            <TotalsTable
              title="Pago por trabajador"
              firstColumn="Trabajador"
              extraColumn={{ label: 'Grupo', render: (r) => r.groupName }}
              rows={data.workers.map((w) => ({ ...w, key: w.workerId }))}
            />
            <TotalsTable
              title="Totales por grupo"
              firstColumn="Grupo"
              extraColumn={{ label: 'Trab.', render: (r) => r.workerCount }}
              rows={data.byGroup.map((g) => ({ ...g, key: g.groupId }))}
            />
            <TotalsTable
              title="Totales por huerto"
              firstColumn="Huerto"
              rows={data.byGarden.map((g) => ({ ...g, key: g.gardenId }))}
            />
          </>
        )}
      </div>

      {/* Payslips: only rendered on paper */}
      {hasData && (
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
