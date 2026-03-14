import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfitnesskey';

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      res.status(401).json({ error: 'Not authorized to access this route. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user payload to request
    (req as any).user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized to access this route. Invalid token.' });
  }
};
