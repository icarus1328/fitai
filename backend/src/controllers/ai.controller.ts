import { Request, Response } from 'express';
import { generateRecommendations } from '../services/aiCoach.service';
import db from '../config/db';

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const recommendations = await generateRecommendations(userId);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    // Workout frequency per week (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const workouts = await db.workout.findMany({
      where: { userId, date: { gte: eightWeeksAgo } },
      include: {
        sets: {
          include: { exercise: true }
        }
      },
      orderBy: { date: 'asc' },
    });

    // Group workouts by week label
    const weekMap = new Map<string, { workouts: number; volume: number }>();
    workouts.forEach(w => {
      const d = new Date(w.date);
      // ISO week key: "Mon Mar 10"
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday start
      const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weekMap.has(key)) weekMap.set(key, { workouts: 0, volume: 0 });
      const entry = weekMap.get(key)!;
      entry.workouts += 1;
      w.sets.forEach(s => { entry.volume += s.weight * s.reps; });
    });

    const frequencyData = Array.from(weekMap.entries()).map(([week, data]) => ({
      week,
      workouts: data.workouts,
      volume: Math.round(data.volume),
    }));

    // Strength progression for top exercises
    const allSets = await db.workoutSet.findMany({
      where: { workout: { userId } },
      include: { exercise: true, workout: true },
      orderBy: { workout: { date: 'asc' } },
    });

    // Group by exercise for progression chart
    const exerciseProgression: Record<string, Array<{ date: string; orm: number }>> = {};
    allSets.forEach((s: any) => {
      const name = s.exercise.name;
      if (!exerciseProgression[name]) exerciseProgression[name] = [];
      const orm = s.reps === 1 ? s.weight : Math.round(s.weight * (1 + s.reps / 30));
      exerciseProgression[name].push({
        date: new Date(s.workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orm,
      });
    });

    // Pick top 3 most-logged exercises for the chart
    const topExercises = Object.entries(exerciseProgression)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([name, data]) => ({ name, data }));

    res.status(200).json({
      frequencyData,
      topExercises,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
