/**
 * ExerciseDB Hierarchical Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches ALL exercises from ExerciseDB (RapidAPI) and inserts them into
 * the local PostgreSQL database using the hierarchical structure:
 *   BodyRegion -> MuscleGroup -> Exercise
 *
 * Usage:
 *   RAPIDAPI_KEY=<your_key> npx ts-node prisma/seedExercises.ts
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const db = new PrismaClient();

// ── API config ────────────────────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const BATCH_SIZE = 100;
const TOTAL_LIMIT = 1300;

if (!RAPIDAPI_KEY) {
  console.error('\n❌  RAPIDAPI_KEY is not set.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const mapBodyRegion = (bodyPart: string): string => {
  const bp = bodyPart.toLowerCase();
  if (['chest', 'back', 'shoulders', 'upper arms', 'lower arms', 'neck'].includes(bp)) return 'Upper Body';
  if (['upper legs', 'lower legs'].includes(bp)) return 'Lower Body';
  if (['waist'].includes(bp)) return 'Core';
  if (['cardio'].includes(bp)) return 'Cardio';
  return 'Full Body';
};

const normaliseTarget = (raw: string): string =>
  raw.charAt(0).toUpperCase() + raw.slice(1);

const inferDifficulty = (equipment: string, target: string): string => {
  const compoundTargets = ['glutes', 'quads', 'hamstrings', 'lats', 'traps', 'chest'];
  const heavyEquipment  = ['barbell', 'cable', 'olympic barbell'];
  if (heavyEquipment.includes(equipment.toLowerCase()) &&
      compoundTargets.some(t => target.toLowerCase().includes(t))) {
    return 'Advanced';
  }
  if (['band', 'body weight', 'ez barbell', 'kettlebell'].includes(equipment.toLowerCase())) {
    return 'Beginner';
  }
  return 'Intermediate';
};

const fetchJSON = (path: string): Promise<any> =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: RAPIDAPI_HOST,
      path,
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse response`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏋️  Hierarchical ExerciseDB Seeder starting…\n');

  // 1. Fetch all exercises
  const allExercises: any[] = [];
  let offset = 0;

  while (offset < TOTAL_LIMIT) {
    const limit = Math.min(BATCH_SIZE, TOTAL_LIMIT - offset);
    process.stdout.write(`   Fetching offset=${offset}  limit=${limit}… `);

    const batch = await fetchJSON(`/exercises?limit=${limit}&offset=${offset}`);
    if (!Array.isArray(batch) || batch.length === 0) break;

    allExercises.push(...batch);
    console.log(`got ${batch.length} (total so far: ${allExercises.length})`);

    offset += batch.length;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅  Fetched ${allExercises.length} exercises from ExerciseDB`);
  console.log('📦  Inserting into database…\n');

  // 2. Pre-seed basic Body Regions
  const regionNames = ['Upper Body', 'Lower Body', 'Core', 'Full Body', 'Cardio'];
  const regionMap = new Map<string, string>();
  for (const r of regionNames) {
    const dbRegion = await db.bodyRegion.upsert({
      where: { name: r },
      update: {},
      create: { name: r },
    });
    regionMap.set(r, dbRegion.id);
  }

  // Helper to memoize MuscleGroup creation
  const muscleGroupMap = new Map<string, string>();
  // Pre-load existing to map
  const existingMg = await db.muscleGroup.findMany();
  for (const m of existingMg) {
    muscleGroupMap.set(m.name, m.id);
  }

  const getOrAddMuscleGroup = async (name: string, fallbackRegionId: string) => {
    if (muscleGroupMap.has(name)) return muscleGroupMap.get(name)!;
    const mg = await db.muscleGroup.upsert({
      where: { name },
      update: {},
      create: { name, bodyRegionId: fallbackRegionId }
    });
    muscleGroupMap.set(name, mg.id);
    return mg.id;
  };

  let created = 0;
  let skipped = 0;

  for (const ex of allExercises) {
    try {
      const regionName = mapBodyRegion(ex.bodyPart);
      const regionId = regionMap.get(regionName)!;

      // Primary Muscle Group
      const primaryTargetName = normaliseTarget(ex.target);
      const primaryMuscleGroupId = await getOrAddMuscleGroup(primaryTargetName, regionId);

      // Secondary Muscle Groups
      const secondaryRaw: string[] = ex.secondaryMuscles ?? [];
      const secondaryIds: string[] = [];
      for (const smName of secondaryRaw) {
        const norm = normaliseTarget(smName);
        const smId = await getOrAddMuscleGroup(norm, regionId);
        secondaryIds.push(smId);
      }
      
      const uniqueSecondaryIds = [...new Set(secondaryIds)];

      const instructionText = (ex.instructions ?? []).join('\n');
      const normalisedName = ex.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const equipment = ex.equipment ? ex.equipment.charAt(0).toUpperCase() + ex.equipment.slice(1) : null;
      const difficulty = inferDifficulty(ex.equipment ?? '', ex.target ?? '');

      await db.exercise.upsert({
        where: { externalId: ex.id },
        update: {
          mediaUrl: ex.gifUrl ?? null,
          primaryMuscleId: primaryMuscleGroupId,
          secondaryMuscles: {
            deleteMany: {},
            create: uniqueSecondaryIds.map(id => ({ muscleGroup: { connect: { id } } }))
          }
        },
        create: {
          externalId: ex.id,
          name: normalisedName,
          primaryMuscleId: primaryMuscleGroupId,
          equipment,
          difficulty,
          instructions: instructionText || null,
          mediaUrl: ex.gifUrl ?? null,
          secondaryMuscles: {
            create: uniqueSecondaryIds.map(id => ({ muscleGroup: { connect: { id } } }))
          }
        },
      });
      created++;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        skipped++;
      } else {
        console.warn(`   ⚠️  Skipped "${ex.name}": ${err?.message ?? err}`);
        skipped++;
      }
    }
  }

  console.log(`\n🎉  Done!`);
  console.log(`   ✔  Inserted/updated : ${created}`);
  console.log(`   ⏭  Skipped (dup)    : ${skipped}`);
  console.log(`   📊  Total Exercises  : ${await db.exercise.count()}`);
  console.log(`   📊  Total Regions    : ${await db.bodyRegion.count()}`);
  console.log(`   📊  Total Muscles    : ${await db.muscleGroup.count()}`);
}

main()
  .catch((e) => {
    console.error('\n❌  Seeder failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
