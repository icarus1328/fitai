import { Router } from 'express';
import { getRecommendations, getDashboardData } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/recommendations', protect, getRecommendations);
router.get('/dashboard', protect, getDashboardData);

export default router;
