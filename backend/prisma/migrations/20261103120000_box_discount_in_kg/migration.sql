-- "Descuento por caja" changes from pesos per box to kilos per box.
-- Entry snapshots were saved in pesos: convert them with the entry's own price so
-- stored totals keep matching ($350 discount at $350/kg -> 1 kg per box).
-- fruit_types is left as is: the admin already entered the discount in kg (Fresa = 1).
UPDATE "entries" SET "discountPerBoxSnapshot" = "discountPerBoxSnapshot" / "pricePerKgSnapshot" WHERE "pricePerKgSnapshot" > 0;
