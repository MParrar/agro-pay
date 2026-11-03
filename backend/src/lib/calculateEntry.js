import { HttpError } from './httpError.js';

/**
 * Piece-rate pay for a single delivery.
 *   netKg = kg - boxes * discountPerBox   (discountPerBox is kilos per box)
 *   total = round(netKg * pricePerKg)
 * rates: { pricePerKg, discountPerBox } (a FruitType or snapshot values).
 * Rejects the entry when the boxes discount more kilos than were delivered.
 */
export function calculateEntry({ kg, boxes }, rates) {
  const netKg = kg - boxes * rates.discountPerBox;

  if (netKg < 0) {
    throw new HttpError(
      400,
      'Los kilos descontados por cajas superan los kilos entregados. Revise los kilos o las cajas.'
    );
  }

  return {
    netKg,
    totalPaid: Math.round(netKg * rates.pricePerKg),
  };
}
