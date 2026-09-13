import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'dev.db');

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in dependency order
  await prisma.photo.deleteMany();
  await prisma.weightRecord.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.litter.deleteMany();
  await prisma.sheep.deleteMany();

  console.log('  ✓ Cleared existing data');

  // ============================================
  // GENERATION 1 — Grandparents
  // ============================================
  const zeus = await prisma.sheep.create({
    data: {
      id: 'sheep-zeus-001',
      earTag: 'PL-DRP-001',
      name: 'Zeus',
      sex: 'MALE',
      birthDate: new Date('2020-03-15'),
      status: 'SOLD',
      lineage: 'Imported bloodline — South Africa',
    },
  });

  const hera = await prisma.sheep.create({
    data: {
      id: 'sheep-hera-002',
      earTag: 'PL-DRP-002',
      name: 'Hera',
      sex: 'FEMALE',
      birthDate: new Date('2020-05-20'),
      status: 'SOLD',
      lineage: 'Imported bloodline — Namibia',
    },
  });

  console.log('  ✓ Created Generation 1: Zeus (Ram), Hera (Ewe)');

  // ============================================
  // GENERATION 2 — Breeding stock
  // ============================================
  const atlas = await prisma.sheep.create({
    data: {
      id: 'sheep-atlas-003',
      earTag: 'PL-DRP-003',
      name: 'Atlas',
      sex: 'MALE',
      birthDate: new Date('2022-02-10'),
      status: 'ACTIVE',
      lineage: 'Zeus × Hera — F1',
      motherId: hera.id,
      fatherId: zeus.id,
    },
  });

  const bella = await prisma.sheep.create({
    data: {
      id: 'sheep-bella-004',
      earTag: 'PL-DRP-004',
      name: 'Bella',
      sex: 'FEMALE',
      birthDate: new Date('2022-04-18'),
      status: 'ACTIVE',
      lineage: 'Unrelated import — Germany',
    },
  });

  // Diana shares father Zeus (different dam not in system)
  // → This creates an inbreeding risk with Atlas's offspring!
  const diana = await prisma.sheep.create({
    data: {
      id: 'sheep-diana-005',
      earTag: 'PL-DRP-005',
      name: 'Diana',
      sex: 'FEMALE',
      birthDate: new Date('2022-06-05'),
      status: 'ACTIVE',
      lineage: 'Zeus × Unknown dam',
      fatherId: zeus.id,
    },
  });

  console.log('  ✓ Created Generation 2: Atlas (Ram), Bella (Ewe), Diana (Ewe)');

  // ============================================
  // GENERATION 3 — Offspring
  // ============================================
  const echo = await prisma.sheep.create({
    data: {
      id: 'sheep-echo-006',
      earTag: 'PL-DRP-006',
      name: 'Echo',
      sex: 'MALE',
      birthDate: new Date('2024-01-20'),
      status: 'ACTIVE',
      lineage: 'Atlas × Bella — F2',
      motherId: bella.id,
      fatherId: atlas.id,
    },
  });

  console.log('  ✓ Created Generation 3: Echo (Ram lamb)');
  console.log('  ℹ  Inbreeding test: Echo × Diana should WARN (common ancestor: Zeus)');

  // ============================================
  // LITTER — Atlas × Bella
  // ============================================
  await prisma.litter.create({
    data: {
      id: 'litter-001',
      matingDate: new Date('2023-10-05'),
      lambingDate: new Date('2024-01-20'),
      bornCount: 1,
      weanedCount: 1,
      motherId: bella.id,
      fatherId: atlas.id,
    },
  });

  console.log('  ✓ Created Litter: Atlas × Bella → Echo');

  // ============================================
  // WEIGHT RECORDS
  // ============================================
  // Echo — birth weight
  await prisma.weightRecord.create({
    data: {
      id: 'weight-echo-birth',
      weight: 3.8,
      date: new Date('2024-01-20'),
      type: 'BIRTH',
      sheepId: echo.id,
    },
  });

  // Echo — weaning weight (120 days later → ADG = (28.5-3.8)/120 = 0.206 kg/day)
  await prisma.weightRecord.create({
    data: {
      id: 'weight-echo-weaning',
      weight: 28.5,
      date: new Date('2024-05-20'),
      type: 'WEANING',
      sheepId: echo.id,
    },
  });

  // Atlas — birth weight
  await prisma.weightRecord.create({
    data: {
      id: 'weight-atlas-birth',
      weight: 4.2,
      date: new Date('2022-02-10'),
      type: 'BIRTH',
      sheepId: atlas.id,
    },
  });

  // Atlas — adult weight
  await prisma.weightRecord.create({
    data: {
      id: 'weight-atlas-adult',
      weight: 95.0,
      date: new Date('2026-01-15'),
      type: 'ADULT',
      sheepId: atlas.id,
    },
  });

  // Bella — adult weight
  await prisma.weightRecord.create({
    data: {
      id: 'weight-bella-adult',
      weight: 68.0,
      date: new Date('2025-11-10'),
      type: 'ADULT',
      sheepId: bella.id,
    },
  });

  console.log('  ✓ Created 5 weight records (Echo: birth 3.8kg → weaning 28.5kg, ADG ≈ 0.206 kg/day)');

  // ============================================
  // HEALTH RECORDS
  // ============================================
  // Atlas — annual vaccine
  await prisma.healthRecord.create({
    data: {
      id: 'health-atlas-vaccine',
      date: new Date('2026-01-15'),
      type: 'VACCINE',
      description: 'Annual Clostridial vaccine (Covexin 10)',
      medication: 'Covexin 10',
      withdrawalDays: 0,
      cost: 45.0,
      sheepId: atlas.id,
    },
  });

  // Bella — deworming with active withdrawal period!
  // Given on March 25, 2026 + 28 days = withdrawal expires April 22, 2026
  await prisma.healthRecord.create({
    data: {
      id: 'health-bella-deworming',
      date: new Date('2026-03-25'),
      type: 'DEWORMING',
      description: 'Ivermectin deworming — routine spring treatment',
      medication: 'Ivermectin 1%',
      withdrawalDays: 28,
      cost: 35.0,
      sheepId: bella.id,
    },
  });

  // Echo — hoof trimming
  await prisma.healthRecord.create({
    data: {
      id: 'health-echo-hoof',
      date: new Date('2026-02-20'),
      type: 'HOOF',
      description: 'Routine hoof trimming — all four hooves',
      cost: 60.0,
      sheepId: echo.id,
    },
  });

  // Diana — vet visit
  await prisma.healthRecord.create({
    data: {
      id: 'health-diana-vet',
      date: new Date('2025-12-10'),
      type: 'VET_VISIT',
      description: 'Pre-breeding fertility assessment',
      cost: 150.0,
      sheepId: diana.id,
    },
  });

  console.log('  ✓ Created 4 health records (Bella has ACTIVE withdrawal until April 22, 2026)');

  // ============================================
  // FINANCIAL TRANSACTIONS
  // ============================================
  // Sale of Zeus
  await prisma.transaction.create({
    data: {
      id: 'txn-zeus-sale',
      date: new Date('2025-11-10'),
      type: 'INCOME',
      category: 'SALE',
      amount: 3500.0,
      description: 'Sale of Zeus (breeding ram) — buyer: Hodowla Kowalski',
      sheepId: zeus.id,
    },
  });

  // Equipment purchase
  await prisma.transaction.create({
    data: {
      id: 'txn-equipment-001',
      date: new Date('2025-12-01'),
      type: 'EXPENSE',
      category: 'EQUIPMENT',
      amount: 1500.0,
      description: 'Digital livestock scale (Gallagher W310)',
    },
  });

  // Feed — January
  await prisma.transaction.create({
    data: {
      id: 'txn-feed-jan',
      date: new Date('2026-01-05'),
      type: 'EXPENSE',
      category: 'FEED',
      amount: 850.0,
      description: 'Hay and concentrate feed — January supply',
    },
  });

  // Vet bill for Bella
  await prisma.transaction.create({
    data: {
      id: 'txn-vet-bella',
      date: new Date('2026-03-25'),
      type: 'EXPENSE',
      category: 'VET',
      amount: 200.0,
      description: 'Deworming treatment — Bella (PL-DRP-004)',
      sheepId: bella.id,
    },
  });

  // Feed — March
  await prisma.transaction.create({
    data: {
      id: 'txn-feed-mar',
      date: new Date('2026-03-01'),
      type: 'EXPENSE',
      category: 'FEED',
      amount: 920.0,
      description: 'Hay, minerals, and supplement — March supply',
    },
  });

  console.log('  ✓ Created 5 transactions (Income: 3,500 PLN | Expenses: 3,470 PLN)');

  // ============================================
  // SUMMARY
  // ============================================
  const sheepCount = await prisma.sheep.count();
  const weightCount = await prisma.weightRecord.count();
  const healthCount = await prisma.healthRecord.count();
  const txnCount = await prisma.transaction.count();
  const litterCount = await prisma.litter.count();

  console.log('\n✅ Seed complete!');
  console.log(`   📊 ${sheepCount} sheep | ${weightCount} weights | ${healthCount} health records | ${txnCount} transactions | ${litterCount} litters`);
  console.log('\n   Family tree:');
  console.log('   Zeus ─┬─ Hera');
  console.log('         └→ Atlas ─┬─ Bella');
  console.log('                   └→ Echo');
  console.log('   Zeus ─── (unknown dam)');
  console.log('         └→ Diana');
  console.log('\n   ⚠️  Test inbreeding: Try pairing Echo × Diana → should warn (common ancestor: Zeus)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
