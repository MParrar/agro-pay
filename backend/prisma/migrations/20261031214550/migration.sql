-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateTable
CREATE TABLE "fruit_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerFruit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPerBox" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "fruit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardens" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "rut" TEXT,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "fruitTypeId" INTEGER NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "units" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boxes" INTEGER NOT NULL DEFAULT 0,
    "pricePerKgSnapshot" DOUBLE PRECISION NOT NULL,
    "pricePerFruitSnapshot" DOUBLE PRECISION NOT NULL,
    "discountPerBoxSnapshot" DOUBLE PRECISION NOT NULL,
    "totalPaid" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gardens_name_key" ON "gardens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workers_name_key" ON "workers"("name");

-- CreateIndex
CREATE INDEX "workers_groupId_idx" ON "workers"("groupId");

-- CreateIndex
CREATE INDEX "entries_createdAt_idx" ON "entries"("createdAt");

-- CreateIndex
CREATE INDEX "entries_workerId_idx" ON "entries"("workerId");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_fruitTypeId_fkey" FOREIGN KEY ("fruitTypeId") REFERENCES "fruit_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
