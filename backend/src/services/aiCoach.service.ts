import db from '../config/db';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetData {
  weight: number;
  reps: number;
  exercise: { name: string; primaryMuscle?: { name: string } };
  workout: { date: Date };
}

interface WeeklyVolume {
  [muscle: string]: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// One-rep max estimate (Epley formula)
const estimateORM = (weight: number, reps: number) =>
  reps === 1 ? weight : weight * (1 + reps / 30);

// TDEE via Mifflin-St Jeor
const calculateTDEE = (
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string
): number => {
  const bmr =
    gender === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
};

// ─── Core AI Functions ────────────────────────────────────────────────────────

/**
 * Detect plateau for a given exercise over the last 4 sessions.
 * Returns true if estimated 1RM hasn't increased by >2%.
 */
export const detectPlateau = (sets: SetData[]): boolean => {
  if (sets.length < 4) return false;
  const orms = sets.slice(0, 4).map(s => estimateORM(s.weight, s.reps));
  const oldest = orms[orms.length - 1];
  const newest = orms[0];
  return (newest - oldest) / oldest < 0.02;
};

/**
 * Suggest the next workout for an exercise based on latest best set.
 */
export const suggestNextWorkout = (
  exerciseName: string,
  sets: SetData[]
): { weight: number; reps: number; sets: number; note: string } | null => {
  if (!sets || sets.length === 0) return null;

  const bestSet = sets.reduce((best, s) =>
    estimateORM(s.weight, s.reps) > estimateORM(best.weight, best.reps) ? s : best
  );

  const plateau = detectPlateau(sets);

  if (plateau) {
    // Deload: reduce weight 5%, increase reps
    return {
      weight: Math.round(bestSet.weight * 0.95 * 2) / 2,
      reps: bestSet.reps + 2,
      sets: 3,
      note: `Your ${exerciseName} has plateaued. Try a deload this session — lighter weight, more reps.`,
    };
  }

  // Progressive overload: add 2.5 kg
  return {
    weight: bestSet.weight + 2.5,
    reps: bestSet.reps,
    sets: 3,
    note: `Looking strong! Try adding 2.5 kg to your ${exerciseName} this session.`,
  };
};

/**
 * Calculate weekly training volume per muscle group.
 */
export const calcWeeklyVolume = (sets: SetData[]): WeeklyVolume => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentSets = sets.filter(s => new Date(s.workout.date) >= oneWeekAgo);

  return recentSets.reduce((acc, s) => {
    const muscle = s.exercise.primaryMuscle?.name || 'Mixed';
    acc[muscle] = (acc[muscle] || 0) + s.weight * s.reps;
    return acc;
  }, {} as WeeklyVolume);
};

/**
 * Count weekly sets per muscle group.
 */
export const countWeeklySetsPerMuscle = (sets: SetData[]): Record<string, number> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentSets = sets.filter(s => new Date(s.workout.date) >= oneWeekAgo);

  return recentSets.reduce((acc, s) => {
    const muscle = s.exercise.primaryMuscle?.name || 'Mixed';
    acc[muscle] = (acc[muscle] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Detect muscles trained in last 48h (recovery warning).
 */
export const detectRecoveryWarnings = (sets: SetData[]): string[] => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

  const recentMuscles = new Set<string>();
  sets.forEach(s => {
    if (new Date(s.workout.date) >= twoDaysAgo) {
      recentMuscles.add(s.exercise.primaryMuscle?.name || 'Mixed');
    }
  });

  return Array.from(recentMuscles);
};

// ─── Main AI recommendation generator ────────────────────────────────────────

export const generateRecommendations = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { weakMuscles: true },
  });

  if (!user) throw new Error('User not found');

  // Fetch all sets for this user
  const allSets = await db.workoutSet.findMany({
    where: { workout: { userId } },
    include: {
      exercise: { include: { primaryMuscle: true } },
      workout: true,
    },
    orderBy: { workout: { date: 'desc' } },
  }) as unknown as SetData[];

  // Group sets by exercise
  const byExercise: Record<string, SetData[]> = {};
  allSets.forEach(s => {
    const exerciseName = s.exercise.name;
    if (!byExercise[exerciseName]) byExercise[exerciseName] = [];
    byExercise[exerciseName].push(s);
  });

  // Progressive overload suggestions
  const progressionSuggestions = Object.entries(byExercise)
    .map(([name, sets]) => ({
      exercise: name,
      suggestion: suggestNextWorkout(name, sets),
    }))
    .filter(s => s.suggestion !== null);

  // Weekly volume & set counts
  const weeklySets = countWeeklySetsPerMuscle(allSets);

  const volumeWarnings: string[] = [];
  Object.entries(weeklySets).forEach(([muscle, count]) => {
    if (count < 10) {
      volumeWarnings.push(`You're doing only ${count} sets/week for ${muscle}. Aim for 10–20 sets for hypertrophy.`);
    } else if (count > 22) {
      volumeWarnings.push(`You're doing ${count} sets/week for ${muscle}. Consider reducing volume to avoid overtraining.`);
    }
  });

  // Recovery warnings
  const recentMuscles = detectRecoveryWarnings(allSets);
  const recoveryWarnings = recentMuscles.map(
    m => `${m} was trained in the last 48 hours. Make sure you allow at least 48h of recovery.`
  );

  // Calorie & weight prediction
  let caloriePlan: any = null;
  if (user.currentWeight && user.targetWeight && user.height && user.age) {
    const tdee = calculateTDEE(
      user.currentWeight,
      user.height,
      user.age,
      user.gender || 'male',
      user.activityLevel || 'moderately_active'
    );
    const weightDelta = user.targetWeight - user.currentWeight;
    const isBulk = weightDelta > 0;
    const targetCalories = isBulk ? tdee + 300 : tdee - 500;
    const weeklyChangeKg = isBulk ? 0.3 : 0.5;
    const estimatedDays = Math.abs(weightDelta / (weeklyChangeKg / 7));

    caloriePlan = {
      tdee,
      targetCalories,
      goal: isBulk ? 'bulk' : 'cut',
      estimatedDays: Math.round(estimatedDays),
      weightDelta: weightDelta.toFixed(1),
    };
  }

  return {
    progressionSuggestions,
    volumeWarnings,
    recoveryWarnings,
    caloriePlan,
  };
};
