import { Request, Response } from 'express';
import db from '../config/db';
import { computeUserScore, getTier, getNextTierThreshold } from '../services/ranking.service';

// ── Compute & return the calling user's rank ─────────────────────────────────
export const getMyRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const scores = await computeUserScore(userId);

    // Rank position: count users with higher fitnessScore
    const rank = await db.user.count({
      where: { fitnessScore: { gt: scores.fitnessScore } },
    });

    const totalUsers = await db.user.count();

    res.status(200).json({
      ...scores,
      rank: rank + 1,
      totalUsers,
      nextTierThreshold: getNextTierThreshold(scores.fitnessScore),
    });
  } catch (error) {
    console.error('getMyRank error:', error);
    res.status(500).json({ error: 'Failed to compute rank' });
  }
};

// ── Global leaderboard ────────────────────────────────────────────────────────
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Re-compute scores for all users (so leaderboard is always fresh)
    const allUsers = await db.user.findMany({ select: { id: true } });
    await Promise.all(allUsers.map((u: { id: string }) => computeUserScore(u.id)));

    // Fetch sorted leaderboard
    const users = await db.user.findMany({
      orderBy: { fitnessScore: 'desc' },
      select: {
        id: true,
        name: true,
        fitnessScore: true,
        strengthScore: true,
        volumeScore: true,
        consistencyScore: true,
        rankTier: true,
        workouts: {
          where: { date: { gte: thirtyDaysAgo } },
          select: { id: true },
        },
      },
    });

    const leaderboard = users.map((u: any, idx: number) => ({
      rank: idx + 1,
      id: u.id,
      name: u.name || 'Anonymous',
      fitnessScore: Math.round(u.fitnessScore * 10) / 10,
      strengthScore: Math.round(u.strengthScore),
      volumeScore: Math.round(u.volumeScore),
      consistencyScore: Math.round(u.consistencyScore),
      rankTier: u.rankTier,
      workoutsThisMonth: u.workouts.length,
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
