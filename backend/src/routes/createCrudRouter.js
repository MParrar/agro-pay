import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { parseId } from '../lib/validate.js';

/**
 * Standard REST router for simple catalog models.
 * @param {object} config
 * @param {string} config.model        Prisma model delegate name (e.g. "fruitType")
 * @param {(body) => object} config.parse  Validates the body and returns Prisma data
 * @param {string} config.notFoundMessage
 * @param {string} config.inUseMessage  Shown when deleting a record that is referenced
 * @param {(id) => Promise<number>} config.countUsage  How many records reference this one
 * @param {(name) => string} config.duplicateMessage  Shown when the (citext, unique) name is taken
 */
export function createCrudRouter({
  model,
  parse,
  notFoundMessage,
  inUseMessage,
  countUsage,
  duplicateMessage,
  orderBy = { name: 'asc' },
}) {
  const router = Router();
  const delegate = prisma[model];

  async function findOr404(id) {
    const item = await delegate.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, notFoundMessage);
    return item;
  }

  // The name column is citext, so findUnique compares case-insensitively.
  async function assertNameAvailable(name, excludeId) {
    const existing = await delegate.findUnique({ where: { name } });
    if (existing && existing.id !== excludeId) throw new HttpError(409, duplicateMessage(existing.name));
  }

  async function save(operation, name) {
    try {
      return await operation();
    } catch (err) {
      // Race condition fallback: DB unique index rejected the name
      if (err?.code === 'P2002') throw new HttpError(409, duplicateMessage(name));
      throw err;
    }
  }

  router.get('/', async (req, res) => {
    res.json(await delegate.findMany({ orderBy }));
  });

  router.get('/:id', async (req, res) => {
    res.json(await findOr404(parseId(req.params.id)));
  });

  router.post('/', async (req, res) => {
    const data = parse(req.body ?? {});
    await assertNameAvailable(data.name);
    const item = await save(() => delegate.create({ data }), data.name);
    res.status(201).json(item);
  });

  router.put('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    await findOr404(id);
    const data = parse(req.body ?? {});
    await assertNameAvailable(data.name, id);
    res.json(await save(() => delegate.update({ where: { id }, data }), data.name));
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    await findOr404(id);
    // Checked up front: Postgres RESTRICT violations (23001) reach us as an
    // unknown Prisma error without a P-code, so the catch below can't see them.
    if ((await countUsage(id)) > 0) throw new HttpError(409, inUseMessage);
    try {
      await delegate.delete({ where: { id } });
    } catch (err) {
      if (err?.code === 'P2003' || err?.code === 'P2014') throw new HttpError(409, inUseMessage);
      throw err;
    }
    res.status(204).end();
  });

  return router;
}
