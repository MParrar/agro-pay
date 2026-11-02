import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { parseId, requireString, optionalString } from '../lib/validate.js';

const router = Router();
const include = { group: true };

function duplicateNameError(name) {
  return new HttpError(409, `Ya existe un trabajador con el nombre "${name}".`);
}

async function parseWorker(body) {
  const name = requireString(body.name, 'El nombre');
  const rut = optionalString(body.rut);
  const groupId = parseId(body.groupId, 'Grupo');

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new HttpError(400, 'El grupo seleccionado no existe.');

  return { name, rut, groupId };
}

// The name column is citext, so findUnique compares case-insensitively.
async function assertNameAvailable(name, excludeId) {
  const existing = await prisma.worker.findUnique({ where: { name } });
  if (existing && existing.id !== excludeId) throw duplicateNameError(existing.name);
}

async function saveWorker(operation, name) {
  try {
    return await operation();
  } catch (err) {
    // Race condition fallback: DB unique index rejected the name
    if (err?.code === 'P2002') throw duplicateNameError(name);
    throw err;
  }
}

router.get('/', async (req, res) => {
  res.json(await prisma.worker.findMany({ include, orderBy: { name: 'asc' } }));
});

router.get('/:id', async (req, res) => {
  const worker = await prisma.worker.findUnique({ where: { id: parseId(req.params.id) }, include });
  if (!worker) throw new HttpError(404, 'Trabajador no encontrado.');
  res.json(worker);
});

router.post('/', async (req, res) => {
  const data = await parseWorker(req.body ?? {});
  await assertNameAvailable(data.name);
  const worker = await saveWorker(() => prisma.worker.create({ data, include }), data.name);
  res.status(201).json(worker);
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Trabajador no encontrado.');

  const data = await parseWorker(req.body ?? {});
  await assertNameAvailable(data.name, id);
  res.json(await saveWorker(() => prisma.worker.update({ where: { id }, data, include }), data.name));
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Trabajador no encontrado.');

  // Checked up front: RESTRICT violations (23001) don't arrive as P2003
  if ((await prisma.entry.count({ where: { workerId: id } })) > 0) {
    throw new HttpError(409, 'No se puede eliminar este trabajador porque tiene entregas registradas.');
  }
  try {
    await prisma.worker.delete({ where: { id } });
  } catch (err) {
    if (err?.code === 'P2003' || err?.code === 'P2014') {
      throw new HttpError(409, 'No se puede eliminar este trabajador porque tiene entregas registradas.');
    }
    throw err;
  }
  res.status(204).end();
});

export default router;
