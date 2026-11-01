import { HttpError } from './httpError.js';

/**
 * Piece-rate pay for a single delivery.
 *   fruitValue = kg * pricePerKg
 *   total      = round(fruitValue - boxes * discountPerBox)
 * rates: { pricePerKg, discountPerBox } (a FruitType or snapshot values).
 * Rejects the entry when the box discount exceeds the fruit value.
 */
export function calculateEntry({ kg, boxes }, rates) {
  const fruitValue = kg * rates.pricePerKg;
  const boxDiscount = boxes * rates.discountPerBox;

  if (boxDiscount > fruitValue) {
    throw new HttpError(
      400,
      'El descuento por cajas supera el valor de la fruta entregada. Revise los kilos o las cajas.'
    );
  }

  return {
    fruitValue,
    boxDiscount,
    totalPaid: Math.round(fruitValue - boxDiscount),
  };
}
