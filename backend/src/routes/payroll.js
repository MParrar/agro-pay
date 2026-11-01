import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { parseDate } from '../lib/validate.js';

const router = Router();
const MAX_RANGE_DAYS = 31;

// Monday 00:00 → next Monday 00:00, in the server's local time
function currentWeekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function emptyTotals() {
  return { totalKg: 0, totalBoxes: 0, totalPaid: 0, entryCount: 0 };
}

function addToTotals(totals, entry) {
  totals.totalKg += entry.kg;
  totals.totalBoxes += entry.boxes;
  totals.totalPaid += entry.totalPaid;
  totals.entryCount += 1;
}

/**
 * GET /api/payroll/weekly?start=ISO&end=ISO
 * The client sends its local week boundaries (end is exclusive) so the
 * week matches the admin's timezone. Defaults to the current week.
 */
router.get('/weekly', async (req, res) => {
  let { start, end } = currentWeekRange();
  if (req.query.start || req.query.end) {
    start = parseDate(req.query.start, 'Inicio de semana');
    end = parseDate(req.query.end, 'Fin de semana');
  }
  if (end <= start) throw new HttpError(400, 'El rango de fechas no es válido.');
  if (end - start > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    throw new HttpError(400, `El rango no puede superar ${MAX_RANGE_DAYS} días.`);
  }

  const entries = await prisma.entry.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { worker: { include: { group: true } }, fruitType: true, garden: true },
    orderBy: { createdAt: 'asc' },
  });

  const workers = new Map();
  const groups = new Map();
  const gardens = new Map();
  const grandTotal = emptyTotals();

  for (const entry of entries) {
    const { worker, garden } = entry;
    const group = worker.group;

    if (!workers.has(worker.id)) {
      workers.set(worker.id, {
        workerId: worker.id,
        name: worker.name,
        rut: worker.rut,
        groupId: group.id,
        groupName: group.name,
        ...emptyTotals(),
        entries: [],
      });
    }
    const workerRow = workers.get(worker.id);
    addToTotals(workerRow, entry);
    workerRow.entries.push({
      id: entry.id,
      createdAt: entry.createdAt,
      gardenName: garden.name,
      fruitTypeName: entry.fruitType.name,
      kg: entry.kg,
      boxes: entry.boxes,
      pricePerKgSnapshot: entry.pricePerKgSnapshot,
      discountPerBoxSnapshot: entry.discountPerBoxSnapshot,
      totalPaid: entry.totalPaid,
    });

    if (!groups.has(group.id)) {
      groups.set(group.id, { groupId: group.id, name: group.name, workerIds: new Set(), ...emptyTotals() });
    }
    const groupRow = groups.get(group.id);
    groupRow.workerIds.add(worker.id);
    addToTotals(groupRow, entry);

    if (!gardens.has(garden.id)) {
      gardens.set(garden.id, { gardenId: garden.id, name: garden.name, ...emptyTotals() });
    }
    addToTotals(gardens.get(garden.id), entry);

    addToTotals(grandTotal, entry);
  }

  const byName = (a, b) => a.name.localeCompare(b.name, 'es');

  res.json({
    start,
    end,
    workers: [...workers.values()].sort(byName),
    byGroup: [...groups.values()]
      .map(({ workerIds, ...row }) => ({ ...row, workerCount: workerIds.size }))
      .sort(byName),
    byGarden: [...gardens.values()].sort(byName),
    grandTotal,
  });
});

export default router;
