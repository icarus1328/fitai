import { Router } from 'express';
import { markAttendance, getAttendance } from '../controllers/attendance.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', protect, getAttendance);
router.post('/', protect, markAttendance);

export default router;
