import { HttpError } from '../lib/httpError.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido.' });
  }

  // Prisma known errors
  switch (err?.code) {
    case 'P2025':
      return res.status(404).json({ error: 'Registro no encontrado.' });
    case 'P2002':
      return res.status(409).json({ error: 'Ya existe un registro con ese nombre.' });
    case 'P2003':
    case 'P2014':
      return res
        .status(409)
        .json({ error: 'No se puede completar la operación porque hay registros asociados.' });
  }

  // Postgres RESTRICT violation surfaces as an unknown Prisma error without a P-code
  if (err?.message?.includes('23001')) {
    return res
      .status(409)
      .json({ error: 'No se puede completar la operación porque hay registros asociados.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}
