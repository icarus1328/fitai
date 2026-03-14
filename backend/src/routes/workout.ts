import { Router } from 'express';
import { logWorkout, getWorkoutHistory } from '../controllers/workout.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Get the user's workout history
router.get('/', protect, getWorkoutHistory);

// Log a new workout
router.post('/', protect, logWorkout);

export default router;
