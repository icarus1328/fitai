import { Request, Response } from 'express';
import db from '../config/db';

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    // 1. Weekly Volume Trend (last 4 weeks)
    const workouts = await db.workout.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      include: { sets: true }
    });

    const volumeByDate: Record<string, number> = {};
    workouts.forEach(w => {
      const dateStr = w.date.toISOString().split('T')[0];
      const vol = w.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      volumeByDate[dateStr] = (volumeByDate[dateStr] || 0) + vol;
    });

    // 2. Muscle Group Distribution (All time)
    const allSets = await db.workoutSet.findMany({
      where: { workout: { userId } },
      include: { exercise: { include: { primaryMuscle: true } } }
    });

    const muscleDistribution: Record<string, number> = {};
    allSets.forEach(s => {
      const muscle = s.exercise.primaryMuscle?.name || 'Other';
      muscleDistribution[muscle] = (muscleDistribution[muscle] || 0) + 1;
    });

    // 3. Top Personal Records
    const prs = await db.personalRecord.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { maxWeight: 'desc' },
      take: 5
    });

    res.status(200).json({
      volumeByDate: Object.entries(volumeByDate).map(([date, volume]) => ({ date, volume })).sort((a,b) => a.date.localeCompare(b.date)),
      muscleDistribution: Object.entries(muscleDistribution).map(([muscle, count]) => ({ muscle, count })),
      personalRecords: prs
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
