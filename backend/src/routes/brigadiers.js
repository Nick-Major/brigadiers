import express from 'express';
const router = express.Router();

// Специализации исполнителей
const SPECIALIZATIONS = [
    "администраторы",
    "декораторы", 
    "помощник садовника",
    "садовники",
    "садовники (хим. обработка)",
    "специалисты по озеленению",
    "старшие администраторы",
    "старшие декораторы",
    "старшие садовники",
    "установщик деревьев",
    "штатные специалисты"
];

// Виды работ
const WORK_TYPES = [
    "высотные работы",
    "демонтажные работы", 
    "другое",
    "монтажные работы",
    "обработка удобрениями",
    "погрузочно-разгрузочные работы",
    "полив растений",
    "посадка растений",
    "работы по уходу за растениями",
    "разгрузка деревьев",
    "установка деревьев",
    "установка заборов"
];

// База данных бригадиров (в памяти)
const brigadiers = [
    { 
        id: 1, 
        full_name: "Иванов Иван Иванович", 
        specialization: "садовники",
        role: "бригадир",
        is_active: true
    },
    { 
        id: 2, 
        full_name: "Петров Петр Петрович", 
        specialization: "декораторы",
        role: "бригадир", 
        is_active: true
    },
    { 
        id: 3, 
        full_name: "Сидоров Алексей Владимирович", 
        specialization: "установщик деревьев",
        role: "бригадир",
        is_active: true
    },
    { 
        id: 4, 
        full_name: "Кузнецова Мария Сергеевна", 
        specialization: "специалисты по озеленению",
        role: "бригадир",
        is_active: true
    },
    { 
        id: 5, 
        full_name: "Николаев Дмитрий Сергеевич", 
        specialization: "старшие садовники",
        role: "инициатор-бригадир",
        is_active: true
    }
];

// Получить всех бригадиров
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: brigadiers.filter(b => b.is_active)
    });
});

// Получить специализации
router.get('/specializations', (req, res) => {
    res.json({
        success: true,
        data: SPECIALIZATIONS
    });
});

// Получить виды работ
router.get('/work-types', (req, res) => {
    res.json({
        success: true,
        data: WORK_TYPES
    });
});

export { router as brigadiersRouter };
