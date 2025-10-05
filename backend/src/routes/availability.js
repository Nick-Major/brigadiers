import express from 'express';
const router = express.Router();

// Получить доступных бригадиров на конкретную дату
router.get('/available-brigadiers/:date', (req, res) => {
  const { date } = req.params;
  
  // Для демо возвращаем всех бригадиров
  // В реальном приложении здесь должна быть логика проверки занятости
  const availableBrigadiers = [
    { id: 1, full_name: "Иванов Иван Иванович", specialization: "Строительные работы" },
    { id: 2, full_name: "Петров Петр Петрович", specialization: "Отделочные работы" },
    { id: 3, full_name: "Сидоров Алексей Владимирович", specialization: "Электромонтажные работы" },
    { id: 4, full_name: "Кузнецова Мария Сергеевна", specialization: "Отделочные работы" }
  ];
  
  res.json({
    success: true,
    data: availableBrigadiers
  });
});

export { router as availabilityRouter };
