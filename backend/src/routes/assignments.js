import express from 'express';
import { PlanningBackend } from '../models/PlanningBackend.js';

const router = express.Router();
const planningBackend = new PlanningBackend();

// GET /api/assignments?startDate=2024-01-15&endDate=2024-01-20
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const assignments = await planningBackend.getAssignments({ startDate, endDate });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/assignments
router.post('/', async (req, res) => {
    try {
        const { brigadier_id, start_date, end_date } = req.body;
        const assignment = await planningBackend.createAssignment(brigadier_id, start_date, end_date);
        res.status(201).json(assignment);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
});

// PATCH /api/assignments/:id/status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const assignment = await planningBackend.updateAssignmentStatus(id, status);
        res.json(assignment);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// POST /api/assignments/reset
router.post('/reset', async (req, res) => {
    try {
        planningBackend.resetData();
        res.json({ message: 'Данные сброшены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
