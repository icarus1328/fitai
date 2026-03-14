import { Router } from 'express';
import { getMyRank, getLeaderboard } from '../controllers/ranking.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.get('/me', protect, getMyRank);
router.get('/leaderboard', protect, getLeaderboard);

export default router;
