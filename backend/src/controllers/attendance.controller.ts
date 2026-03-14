import { Request, Response } from 'express';
import db from '../config/db';

// ── Mark attendance manually ─────────────────────────────────────────────────
export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { date } = req.body;

    const day = date ? new Date(date) : new Date();
    // Normalise to midnight UTC so duplicate-check works correctly
    day.setUTCHours(0, 0, 0, 0);

    const log = await db.attendanceLog.upsert({
      where: { userId_date: { userId, date: day } },
      update: {},
      create: { userId, date: day, source: 'manual' },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('markAttendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// ── Get all attendance logs for current user ─────────────────────────────────
export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const logs = await db.attendanceLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    // Compute metrics
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyVisits = logs.filter((l: any) => new Date(l.date) >= startOfWeek).length;
    const monthlyVisits = logs.filter((l: any) => new Date(l.date) >= startOfMonth).length;

    // Streak: consecutive days up to today
    const attendedDates = new Set(
      logs.map((l: any) => new Date(l.date).toDateString())
    );
    let streak = 0;
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    while (attendedDates.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    res.status(200).json({
      logs: logs.map((l: any) => ({
        date: l.date,
        source: l.source,
      })),
      weeklyVisits,
      monthlyVisits,
      currentStreak: streak,
    });
  } catch (error) {
    console.error('getAttendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};
