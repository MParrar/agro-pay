import { HttpError } from './httpError.js';

export function parseId(value, label = 'ID') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} inválido.`);
  }
  return id;
}

// Trims and collapses inner whitespace so "Juan   Pérez " == "Juan Pérez"
export function requireString(value, label) {
  const str = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!str) {
    throw new HttpError(400, `${label} es obligatorio.`);
  }
  return str;
}

export function optionalString(value) {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

export function parseNonNegativeNumber(value, label) {
  if (value === undefined || value === null || value === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new HttpError(400, `${label} debe ser un número mayor o igual a 0.`);
  }
  return num;
}

export function parseNonNegativeInt(value, label) {
  const num = parseNonNegativeNumber(value, label);
  if (!Number.isInteger(num)) {
    throw new HttpError(400, `${label} debe ser un número entero.`);
  }
  return num;
}

export function parseDate(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${label} no es una fecha válida.`);
  }
  return date;
}
