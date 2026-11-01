import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_GARDEN = 'La dehesa';

async function main() {
  const garden = await prisma.garden.upsert({
    where: { name: DEFAULT_GARDEN },
    update: {},
    create: { name: DEFAULT_GARDEN },
  });
  console.log(`Seeded garden: ${garden.name} (id ${garden.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
