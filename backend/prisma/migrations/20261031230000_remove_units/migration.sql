-- Units (piece count) are no longer tracked; pay is by kilos only
ALTER TABLE "entries" DROP COLUMN "units",
DROP COLUMN "pricePerFruitSnapshot";

ALTER TABLE "fruit_types" DROP COLUMN "pricePerFruit";
