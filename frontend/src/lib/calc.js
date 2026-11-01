// Client-side preview only; the server recalculates and is authoritative.
export function previewEntry({ kg, boxes }, fruitType) {
  if (!fruitType) return null;
  const fruitValue = (Number(kg) || 0) * fruitType.pricePerKg;
  const boxDiscount = (Number(boxes) || 0) * fruitType.discountPerBox;
  return {
    fruitValue,
    boxDiscount,
    total: Math.round(fruitValue - boxDiscount),
    invalid: boxDiscount > fruitValue,
  };
}
