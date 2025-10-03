import express from 'express';
import { PlanningBackend } from '../models/PlanningBackend.js';

const router = express.Router();
const planningBackend = new PlanningBackend();

// Получить всех бригадиров (для назначения)
router.get('/', async (req, res) => {
    try {
        const brigadiers = planningBackend.getAllBrigadiers();
        res.json({ data: brigadiers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
