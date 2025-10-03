import express from 'express';
import { PlanningBackend } from '../models/PlanningBackend.js';

const router = express.Router();
const planningBackend = new PlanningBackend();

// Получить доступных бригадиров на дату (для заявок)
router.get('/available-brigadiers/:date', (req, res) => {
    try {
        const { date } = req.params;
        const availableBrigadiers = planningBackend.getAvailableBrigadiers(date);
        res.json({ data: availableBrigadiers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Проверить доступность бригадира
router.get('/check-brigadier-availability', (req, res) => {
    try {
        const { brigadierId, date } = req.query;
        const isAvailable = planningBackend.isBrigadierAvailable(brigadierId, date);
        res.json({ available: isAvailable });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
