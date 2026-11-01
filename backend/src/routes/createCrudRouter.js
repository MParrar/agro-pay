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
 */
export function createCrudRouter({ model, parse, notFoundMessage, inUseMessage, orderBy = { name: 'asc' } }) {
  const router = Router();
  const delegate = prisma[model];

  async function findOr404(id) {
    const item = await delegate.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, notFoundMessage);
    return item;
  }

  router.get('/', async (req, res) => {
    res.json(await delegate.findMany({ orderBy }));
  });

  router.get('/:id', async (req, res) => {
    res.json(await findOr404(parseId(req.params.id)));
  });

  router.post('/', async (req, res) => {
    const item = await delegate.create({ data: parse(req.body ?? {}) });
    res.status(201).json(item);
  });

  router.put('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    await findOr404(id);
    res.json(await delegate.update({ where: { id }, data: parse(req.body ?? {}) }));
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    await findOr404(id);
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
