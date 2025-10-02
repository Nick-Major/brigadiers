import express from 'express';
import { PlanningBackend } from '../models/PlanningBackend.js';

const router = express.Router();
const planningBackend = new PlanningBackend();

// GET /api/brigadiers
router.get('/', (req, res) => {
    const brigadiers = planningBackend.getAvailableBrigadiers();
    res.json(brigadiers);
});

export default router;