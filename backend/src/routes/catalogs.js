import { prisma } from '../lib/prisma.js';
import { createCrudRouter } from './createCrudRouter.js';
import { requireString, parseNonNegativeNumber } from '../lib/validate.js';

export const fruitTypesRouter = createCrudRouter({
  model: 'fruitType',
  parse: (body) => ({
    name: requireString(body.name, 'El nombre'),
    pricePerKg: parseNonNegativeNumber(body.pricePerKg, 'El precio por kilo'),
    discountPerBox: parseNonNegativeNumber(body.discountPerBox, 'El descuento por caja'),
  }),
  notFoundMessage: 'Tipo de fruta no encontrado.',
  inUseMessage: 'No se puede eliminar esta fruta porque tiene registros de entrega asociados.',
  countUsage: (id) => prisma.entry.count({ where: { fruitTypeId: id } }),
  duplicateMessage: (name) => `Ya existe una fruta con el nombre "${name}".`,
});

export const gardensRouter = createCrudRouter({
  model: 'garden',
  parse: (body) => ({ name: requireString(body.name, 'El nombre') }),
  notFoundMessage: 'Huerto no encontrado.',
  inUseMessage: 'No se puede eliminar este huerto porque tiene registros de entrega asociados.',
  countUsage: (id) => prisma.entry.count({ where: { gardenId: id } }),
  duplicateMessage: (name) => `Ya existe un huerto con el nombre "${name}".`,
});

export const groupsRouter = createCrudRouter({
  model: 'group',
  parse: (body) => ({ name: requireString(body.name, 'El nombre') }),
  notFoundMessage: 'Grupo no encontrado.',
  inUseMessage: 'No se puede eliminar este grupo porque tiene trabajadores asignados.',
  countUsage: (id) => prisma.worker.count({ where: { groupId: id } }),
  duplicateMessage: (name) => `Ya existe un grupo con el nombre "${name}".`,
});
