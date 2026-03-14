import db from '../config/db';

// ─── Tier helpers ─────────────────────────────────────────────────────────────

export const getTier = (score: number): string => {
  if (score >= 700) return 'Elite';
  if (score >= 400) return 'Advanced';
  if (score >= 200) return 'Intermediate';
  return 'Beginner';
};

export const getNextTierThreshold = (score: number): number => {
  if (score >= 700) return 700; // already max
  if (score >= 400) return 700;
  if (score >= 200) return 400;
  return 200;
};

// ─── Score computation ────────────────────────────────────────────────────────

export const computeUserScore = async (userId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all sets
  const allSets = await db.workoutSet.findMany({
    where: { workout: { userId } },
    include: { exercise: true, workout: true },
  });

  const recentSets = allSets.filter(
    (s: any) => new Date(s.workout.date) >= thirtyDaysAgo
  );

  // ── Strength Score: sum of max weight per exercise ──────────────────────────
  const maxPerExercise = new Map<string, number>();
  allSets.forEach((s: any) => {
    const prev = maxPerExercise.get(s.exerciseId) || 0;
    if (s.weight > prev) maxPerExercise.set(s.exerciseId, s.weight);
  });
  const strengthScore = Array.from(maxPerExercise.values()).reduce(
    (sum, w) => sum + w,
    0
  );

  // ── Volume Score: sets × reps × weight in last 30 days ───────────────────────
  const totalVolume = recentSets.reduce(
    (sum: number, s: any) => sum + s.weight * s.reps,
    0
  );
  const volumeScore = totalVolume;

  // ── Consistency Score: sessions × 10 in last 30 days ────────────────────────
  const sessionDates = new Set<string>();
  recentSets.forEach((s: any) => {
    sessionDates.add(new Date(s.workout.date).toDateString());
  });
  const consistencyScore = sessionDates.size * 10;

  // ── Fitness Rank Score ────────────────────────────────────────────────────────
  const fitnessScore =
    0.5 * strengthScore +
    0.3 * (volumeScore / 100) +
    0.2 * consistencyScore;

  const rankTier = getTier(fitnessScore);

  // Persist scores to the User row
  await db.user.update({
    where: { id: userId },
    data: {
      strengthScore,
      volumeScore,
      consistencyScore,
      fitnessScore,
      rankTier,
    },
  });

  return { strengthScore, volumeScore, consistencyScore, fitnessScore, rankTier };
};
