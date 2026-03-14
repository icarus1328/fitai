import { Router } from 'express';
import { getExercises, getExerciseById, getFilterOptions } from '../controllers/exercise.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Dynamic filter options (muscles, equipment)
router.get('/filters', protect, getFilterOptions);

// Get all exercises with search, muscle, equipment, page filters
router.get('/', protect, getExercises);

// Get exercise by ID
router.get('/:id', protect, getExerciseById);

export default router;
