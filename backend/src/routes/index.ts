import { Router } from 'express';
import authRoutes from './auth';
import exerciseRoutes from './exercise';
import workoutRoutes from './workout';
import aiRoutes from './ai';
import rankingRoutes from './ranking';
import attendanceRoutes from './attendance';
import analyticsRoutes from './analytics';

const router = Router();

router.use('/auth', authRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workouts', workoutRoutes);
router.use('/ai', aiRoutes);
router.use('/ranking', rankingRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/analytics', analyticsRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI Fitness Tracker API' });
});

export default router;
