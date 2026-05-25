import express from 'express';
import { getLogs, clearLogs } from '../controllers/logController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get logs (protected)
router.get('/', authMiddleware, getLogs);

// Clear logs (protected)
router.delete('/', authMiddleware, clearLogs);

export default router;
