import { Request, Response } from 'express';
import db from '../config/db';
import { computeUserScore } from '../services/ranking.service';

export const logWorkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { date, notes, sets } = req.body;

    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      res.status(400).json({ error: 'Workout must include at least one set.' });
      return;
    }

    const workoutDate = date ? new Date(date) : new Date();

    const newWorkout = await db.workout.create({
      data: {
        userId,
        date: workoutDate,
        notes,
        sets: {
          create: sets.map((set: any) => ({
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            isWarmup: set.isWarmup || false,
          }))
        }
      },
      include: {
        sets: { include: { exercise: true } }
      }
    });

    // Auto-log attendance for this day
    const attendanceDay = new Date(workoutDate);
    attendanceDay.setUTCHours(0, 0, 0, 0);
    await db.attendanceLog.upsert({
      where: { userId_date: { userId, date: attendanceDay } },
      update: {},
      create: { userId, date: attendanceDay, source: 'workout' },
    });

    // --- Personal Records Logic ---
    const exerciseStats: Record<string, { maxWeight: number, maxReps: number, volume: number }> = {};
    for (const set of sets) {
      if (set.isWarmup) continue;
      const eid = set.exerciseId;
      const w = parseFloat(set.weight) || 0;
      const r = parseInt(set.reps, 10) || 0;
      const vol = w * r;

      if (!exerciseStats[eid]) exerciseStats[eid] = { maxWeight: 0, maxReps: 0, volume: 0 };
      if (w > exerciseStats[eid].maxWeight) exerciseStats[eid].maxWeight = w;
      if (r > exerciseStats[eid].maxReps) exerciseStats[eid].maxReps = r;
      exerciseStats[eid].volume += vol;
    }

    const prNotifications: string[] = [];

    for (const [exerciseId, stats] of Object.entries(exerciseStats)) {
      const existingPR = await db.personalRecord.findUnique({
        where: { userId_exerciseId: { userId, exerciseId } }
      });

      let isNewWeightPR = false;
      let isNewRepsPR = false;
      let isNewVolumePR = false;

      if (!existingPR) {
        isNewWeightPR = stats.maxWeight > 0;
        isNewRepsPR = stats.maxReps > 0;
        isNewVolumePR = stats.volume > 0;
        
        if (isNewWeightPR || isNewRepsPR || isNewVolumePR) {
          const ex = await db.exercise.findUnique({ where: { id: exerciseId } });
          if (ex) prNotifications.push(`[${ex.name}] Baseline established: Weight: ${stats.maxWeight}kg, Reps: ${stats.maxReps}, Volume: ${stats.volume}kg`);
        }
      } else {
        isNewWeightPR = stats.maxWeight > existingPR.maxWeight;
        isNewRepsPR = stats.maxReps > existingPR.maxReps;
        isNewVolumePR = stats.volume > existingPR.maxVolume;

        let msg = '';
        if (isNewWeightPR) msg = `New Max Weight: ${stats.maxWeight}kg (was ${existingPR.maxWeight}kg)!`;
        else if (isNewRepsPR) msg = `New Max Reps: ${stats.maxReps} (was ${existingPR.maxReps})!`;
        else if (isNewVolumePR) msg = `New Max Volume: ${stats.volume}kg (was ${existingPR.maxVolume}kg)!`;

        if (msg) {
          const ex = await db.exercise.findUnique({ where: { id: exerciseId } });
          if (ex) prNotifications.push(`🏆 [${ex.name}] ${msg}`);
        }
      }

      if (isNewWeightPR || isNewRepsPR || isNewVolumePR) {
        await db.personalRecord.upsert({
          where: { userId_exerciseId: { userId, exerciseId } },
          update: {
            maxWeight: isNewWeightPR ? stats.maxWeight : existingPR!.maxWeight,
            maxReps: isNewRepsPR ? stats.maxReps : existingPR!.maxReps,
            maxVolume: isNewVolumePR ? stats.volume : existingPR!.maxVolume,
          },
          create: {
            userId,
            exerciseId,
            maxWeight: stats.maxWeight,
            maxReps: stats.maxReps,
            maxVolume: stats.volume,
          }
        });
      }
    }

    // Recompute fitness rank score asynchronously (don't block response)
    computeUserScore(userId).catch(console.error);

    res.status(201).json({ workout: newWorkout, prNotifications });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
};


export const getWorkoutHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const workouts = await db.workout.findMany({
      where: { userId },
      include: {
        sets: {
          include: {
            exercise: true
          },
          orderBy: [
            { exerciseId: 'asc' },
            { setNumber: 'asc' }
          ]
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json(workouts);
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({ error: 'Failed to fetch workout history' });
  }
};
