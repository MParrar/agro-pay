import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { calculateEntry } from '../lib/calculateEntry.js';
import {
  parseId,
  parseDate,
  parseNonNegativeNumber,
  parseNonNegativeInt,
} from '../lib/validate.js';

const router = Router();
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const include = { worker: { include: { group: true } }, fruitType: true, garden: true };

// GET /api/entries?from=ISO&to=ISO&workerId=N  (all optional; to is exclusive)
router.get('/', async (req, res) => {
  const where = {};
  if (req.query.workerId) where.workerId = parseId(req.query.workerId, 'Trabajador');
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt.gte = parseDate(req.query.from, 'Desde');
    if (req.query.to) where.createdAt.lt = parseDate(req.query.to, 'Hasta');
  }

  res.json(await prisma.entry.findMany({ where, include, orderBy: { createdAt: 'desc' } }));
});

// Shared validation for create and update. createdAt is undefined when not sent.
async function parseEntryInput(body) {
  const workerId = parseId(body.workerId, 'Trabajador');
  const fruitTypeId = parseId(body.fruitTypeId, 'Tipo de fruta');
  const gardenId = parseId(body.gardenId, 'Huerto');
  const kg = parseNonNegativeNumber(body.kg, 'Kilos');
  const boxes = parseNonNegativeInt(body.boxes, 'Cajas');

  if (kg === 0) {
    throw new HttpError(400, 'Debe ingresar los kilos entregados.');
  }

  // Optional: lets the admin log a past day. Small tolerance for client clock skew.
  const createdAt = body.createdAt ? parseDate(body.createdAt, 'Fecha') : undefined;
  if (createdAt && createdAt.getTime() > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new HttpError(400, 'No se pueden registrar entregas en fechas futuras.');
  }

  const [worker, fruitType, garden] = await Promise.all([
    prisma.worker.findUnique({ where: { id: workerId } }),
    prisma.fruitType.findUnique({ where: { id: fruitTypeId } }),
    prisma.garden.findUnique({ where: { id: gardenId } }),
  ]);
  if (!worker) throw new HttpError(400, 'El trabajador seleccionado no existe.');
  if (!fruitType) throw new HttpError(400, 'El tipo de fruta seleccionado no existe.');
  if (!garden) throw new HttpError(400, 'El huerto seleccionado no existe.');

  return { data: { workerId, fruitTypeId, gardenId, kg, boxes }, createdAt, fruitType };
}

router.post('/', async (req, res) => {
  const { data, createdAt, fruitType } = await parseEntryInput(req.body ?? {});
  const { totalPaid } = calculateEntry(data, fruitType);

  const entry = await prisma.entry.create({
    data: {
      ...data,
      pricePerKgSnapshot: fruitType.pricePerKg,
      discountPerBoxSnapshot: fruitType.discountPerBox,
      totalPaid,
      createdAt: createdAt ?? new Date(),
    },
    include,
  });

  res.status(201).json(entry);
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Registro no encontrado.');

  const { data, createdAt, fruitType } = await parseEntryInput(req.body ?? {});

  // Same fruit: keep the rates from the original entry, so a later price change
  // doesn't silently alter it. Different fruit: use that fruit's current rates.
  const rates =
    data.fruitTypeId === existing.fruitTypeId
      ? { pricePerKg: existing.pricePerKgSnapshot, discountPerBox: existing.discountPerBoxSnapshot }
      : { pricePerKg: fruitType.pricePerKg, discountPerBox: fruitType.discountPerBox };
  const { totalPaid } = calculateEntry(data, rates);

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      ...data,
      pricePerKgSnapshot: rates.pricePerKg,
      discountPerBoxSnapshot: rates.discountPerBox,
      totalPaid,
      ...(createdAt ? { createdAt } : {}),
    },
    include,
  });

  res.json(entry);
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Registro no encontrado.');

  await prisma.entry.delete({ where: { id } });
  res.status(204).end();
});

export default router;
