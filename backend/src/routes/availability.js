import express from 'express';
import { getAssignedBrigadiersForDate } from './assignments.js';

const router = express.Router();

// Получить доступных бригадиров на дату (только назначенные и подтвержденные)
router.get('/available-brigadiers/:date', (req, res) => {
    const { date } = req.params;
    console.log(`📅 Запрос доступных бригадиров на дату: ${date}`);
    
    // Получаем назначенных бригадиров на эту дату
    const assignedBrigadiers = getAssignedBrigadiersForDate(date);
    console.log(`👥 Назначенные бригадиры на ${date}:`, assignedBrigadiers);
    
    // Преобразуем в формат для фронтенда (убираем дубликаты по ID)
    const uniqueBrigadiers = [];
    const seenIds = new Set();
    
    assignedBrigadiers.forEach(item => {
        if (!seenIds.has(item.brigadier_id)) {
            seenIds.add(item.brigadier_id);
            uniqueBrigadiers.push({
                id: item.brigadier_id,
                full_name: item.full_name,
                specialization: item.specialization
            });
        }
    });
    
    console.log(`✅ Доступные бригадиры на ${date}:`, uniqueBrigadiers.map(b => b.full_name));
    
    res.json({
        success: true,
        data: uniqueBrigadiers
    });
});

export { router as availabilityRouter };
