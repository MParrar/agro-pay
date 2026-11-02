// Accent- and case-insensitive: "jose" matches "José"
export function normalize(text) {
  return (text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

// RUT search ignores dots and dashes: "12345678" matches "12.345.678-9"
export function normalizeRut(text) {
  return (text || '').replace(/[.\-\s]/g, '').toLowerCase();
}

// True when the query matches the worker's name, group or RUT
export function matchesWorker(query, { name, groupName, rut }) {
  const q = normalize(query);
  if (!q) return true;
  const qRut = normalizeRut(query);
  return (
    normalize(name).includes(q) ||
    normalize(groupName).includes(q) ||
    (qRut !== '' && normalizeRut(rut).includes(qRut))
  );
}
