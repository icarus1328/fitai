import { Request, Response } from 'express';
import db from '../config/db';

export const getExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, regionId, muscleGroupId, equipment, page = '1', limit = '50' } = req.query;

    const take = Math.min(parseInt(String(limit), 10) || 50, 100);
    const skip = (parseInt(String(page), 10) - 1) * take;

    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        name: { contains: String(search), mode: 'insensitive' },
      });
    }

    if (regionId) {
      andConditions.push({
        OR: [
          { primaryMuscle: { bodyRegionId: String(regionId) } },
          { secondaryMuscles: { some: { muscleGroup: { bodyRegionId: String(regionId) } } } }
        ]
      });
    }

    if (muscleGroupId) {
      andConditions.push({
        OR: [
          { primaryMuscleId: String(muscleGroupId) },
          { secondaryMuscles: { some: { muscleGroupId: String(muscleGroupId) } } }
        ]
      });
    }

    if (equipment) {
      andConditions.push({
        equipment: { equals: String(equipment), mode: 'insensitive' },
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [exercises, total] = await Promise.all([
      db.exercise.findMany({
        where,
        include: {
          primaryMuscle: { include: { bodyRegion: true } },
          secondaryMuscles: { include: { muscleGroup: true } }
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      db.exercise.count({ where }),
    ]);

    res.status(200).json({
      exercises,
      total,
      page: parseInt(String(page), 10),
      pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
};

export const getExerciseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const exercise = await db.exercise.findUnique({
      where: { id: String(id) },
      include: {
        primaryMuscle: { include: { bodyRegion: true } },
        secondaryMuscles: { include: { muscleGroup: true } },
        workoutSets: userId
          ? {
              where: { workout: { userId } },
              include: { workout: true },
              orderBy: { workout: { date: 'desc' } },
              take: 10,
            }
          : false,
      },
    });

    if (!exercise) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    res.status(200).json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise details' });
  }
};

// Return distinct values and hierarchical region>muscle tree for filters
export const getFilterOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const [regions, equipments] = await Promise.all([
      db.bodyRegion.findMany({
        include: { muscleGroups: true },
        orderBy: { name: 'asc' }
      }),
      db.exercise.findMany({
        select: { equipment: true },
        distinct: ['equipment'],
        orderBy: { equipment: 'asc' },
        where: { equipment: { not: null } }
      }),
    ]);

    res.status(200).json({
      regions,
      equipment: equipments.map((e: any) => e.equipment).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
};
