// Client-side preview only; the server recalculates and is authoritative.
// discountPerBox is kilos per box.
export function previewEntry({ kg, boxes }, fruitType) {
  if (!fruitType) return null;
  const grossKg = Number(kg) || 0;
  const boxKg = (Number(boxes) || 0) * fruitType.discountPerBox;
  const netKg = grossKg - boxKg;
  return {
    grossKg,
    boxKg,
    netKg,
    total: Math.round(netKg * fruitType.pricePerKg),
    invalid: netKg < 0,
  };
}
