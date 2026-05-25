import express from 'express';
import { getLogs, clearLogs } from '../controllers/logController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get logs (protected)
router.get('/', protect, getLogs);

// Clear logs (protected)
router.delete('/', protect, clearLogs);

export default router;
