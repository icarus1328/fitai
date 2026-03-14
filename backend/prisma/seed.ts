import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  {
    name: 'Barbell Bench Press',
    primaryMuscle: 'Chest',
    difficulty: 'Intermediate',
    instructions: 'Lie flat on a bench, grip the bar slightly wider than shoulder width. Lower the bar to your mid chest and press it back up until arms are fully extended.',
    secondaryMuscles: ['Triceps', 'Shoulders']
  },
  {
    name: 'Incline Dumbbell Press',
    primaryMuscle: 'Chest',
    difficulty: 'Intermediate',
    instructions: 'Set a bench to a 30-45 degree angle. Press dumbbells from your upper chest straight up.',
    secondaryMuscles: ['Triceps', 'Shoulders']
  },
  {
    name: 'Barbell Squat',
    primaryMuscle: 'Legs',
    difficulty: 'Advanced',
    instructions: 'Rest a barbell on your upper back. Squat down until your hips are below your knees, then stand back up.',
    secondaryMuscles: ['Core', 'Lower Back']
  },
  {
    name: 'Leg Press',
    primaryMuscle: 'Legs',
    difficulty: 'Beginner',
    instructions: 'Sit on the machine, place your feet on the platform shoulder-width apart, and push the weight up. Slowly lower and repeat.',
    secondaryMuscles: ['Calves']
  },
  {
    name: 'Deadlift',
    primaryMuscle: 'Back',
    difficulty: 'Advanced',
    instructions: 'Stand with your mid-foot under the barbell. Bend over and grab the bar. Bend your knees until your shins touch the bar. Lift your chest up and straighten your lower back. Stand up with the weight.',
    secondaryMuscles: ['Legs', 'Core', 'Forearms']
  },
  {
    name: 'Lat Pulldown',
    primaryMuscle: 'Back',
    difficulty: 'Beginner',
    instructions: 'Sit at the machine and grab the wide bar. Pull it down to your chin or upper chest area, squeezing your shoulder blades together.',
    secondaryMuscles: ['Biceps']
  },
  {
    name: 'Overhead Press',
    primaryMuscle: 'Shoulders',
    difficulty: 'Intermediate',
    instructions: 'Stand and hold a barbell with a shoulder-width grip at upper chest level. Press the bar straight up overhead.',
    secondaryMuscles: ['Triceps', 'Core']
  },
  {
    name: 'Lateral Raise',
    primaryMuscle: 'Shoulders',
    difficulty: 'Beginner',
    instructions: 'Stand holding dumbbells at your sides. Raise them straight out to your sides until they are at shoulder level. Lower them slowly.',
    secondaryMuscles: []
  },
  {
    name: 'Barbell Curl',
    primaryMuscle: 'Biceps',
    difficulty: 'Beginner',
    instructions: 'Stand holding a barbell with an underhand grip, hands shoulder-width apart. Curl the bar up toward your chest, then lower it slowly.',
    secondaryMuscles: ['Forearms']
  },
  {
    name: 'Tricep Pushdown',
    primaryMuscle: 'Triceps',
    difficulty: 'Beginner',
    instructions: 'Attach a rope or straight bar to a high cable pulley. Keep your elbows tucked in at your sides and push the attachment down until your arms are fully extended.',
    secondaryMuscles: []
  },
  {
    name: 'Cable Crunch',
    primaryMuscle: 'Core',
    difficulty: 'Intermediate',
    instructions: 'Kneel holding a rope attachment from a high pulley behind your head. Crunch down, bringing your elbows toward your knees.',
    secondaryMuscles: []
  }
];

async function main() {
  console.log('Seeding exercises...');

  for (const ex of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name }
    });

    if (!existing) {
      const exercise = await prisma.exercise.create({
        data: {
          name: ex.name,
          primaryMuscle: ex.primaryMuscle,
          difficulty: ex.difficulty,
          instructions: ex.instructions,
        }
      });

      for (const sm of ex.secondaryMuscles) {
        await prisma.exerciseSecondaryMuscle.create({
          data: {
            exerciseId: exercise.id,
            muscleGroup: sm
          }
        });
      }
      console.log(`Created exercise: ${ex.name}`);
    } else {
      console.log(`Exercise already exists: ${ex.name}`);
    }
  }

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
