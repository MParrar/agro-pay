import { formatDate, formatMoney, formatNumber, formatShortDay } from '../lib/format.js';

export default function Payslip({ worker, start, end, pageBreak }) {
  const lastDay = new Date(new Date(end).getTime() - 1);

  return (
    <article className={`payslip mb-6 rounded-lg border border-gray-400 p-5 text-gray-900 ${pageBreak ? 'page-break-after' : ''}`}>
      <header className="mb-3 flex items-start justify-between border-b border-gray-400 pb-3">
        <div>
          <h2 className="text-lg font-bold">Liquidación de pago</h2>
          <p className="text-sm">
            Período del {formatDate(start)} al {formatDate(lastDay)}
          </p>
        </div>
        <span className="text-sm font-semibold">Agro-Pay</span>
      </header>

      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div><dt className="inline font-semibold">Trabajador: </dt><dd className="inline">{worker.name}</dd></div>
        <div><dt className="inline font-semibold">RUT: </dt><dd className="inline">{worker.rut || '—'}</dd></div>
        <div><dt className="inline font-semibold">Grupo: </dt><dd className="inline">{worker.groupName}</dd></div>
      </dl>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-400 text-left">
            <th className="py-1 pr-2">Fecha</th>
            <th className="py-1 pr-2">Huerto</th>
            <th className="py-1 pr-2">Fruta</th>
            <th className="py-1 pr-2 text-right">Kg</th>
            <th className="py-1 pr-2 text-right">Cajas</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {worker.entries.map((e) => (
            <tr key={e.id} className="border-b border-gray-200">
              <td className="py-1 pr-2 capitalize">{formatShortDay(e.createdAt)}</td>
              <td className="py-1 pr-2">{e.gardenName}</td>
              <td className="py-1 pr-2">{e.fruitTypeName}</td>
              <td className="py-1 pr-2 text-right">{formatNumber(e.kg)}</td>
              <td className="py-1 pr-2 text-right">{e.boxes}</td>
              <td className="py-1 text-right">{formatMoney(e.totalPaid)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="pt-2" colSpan={3}>Totales</td>
            <td className="pt-2 pr-2 text-right">{formatNumber(worker.totalKg)}</td>
            <td className="pt-2 pr-2 text-right">{worker.totalBoxes}</td>
            <td className="pt-2 text-right">{formatMoney(worker.totalPaid)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 flex items-end justify-between gap-6">
        <p className="text-base font-bold">Total a pagar: {formatMoney(worker.totalPaid)}</p>
        <div className="w-48 border-t border-gray-500 pt-1 text-center text-xs">Firma trabajador</div>
      </div>
    </article>
  );
}
