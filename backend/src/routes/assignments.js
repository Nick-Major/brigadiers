import express from 'express';
const router = express.Router();

// Хранилище назначений (в памяти)
let assignments = [];
let nextAssignmentId = 1;

// Получить все назначения
router.get('/', (req, res) => {
    const { startDate, endDate } = req.query;
    
    let filteredAssignments = assignments;
    
    if (startDate && endDate) {
        filteredAssignments = assignments.filter(assignment => {
            const assignmentStart = new Date(assignment.start_date);
            const assignmentEnd = new Date(assignment.end_date);
            const filterStart = new Date(startDate);
            const filterEnd = new Date(endDate);
            
            return assignmentStart <= filterEnd && assignmentEnd >= filterStart;
        });
    }
    
    // Добавляем информацию о бригадирах для фронтенда
    const assignmentsWithBrigadiers = filteredAssignments.map(assignment => ({
        ...assignment,
        brigadier: {
            id: assignment.brigadier_id,
            full_name: getBrigadierName(assignment.brigadier_id),
            specialization: getBrigadierSpecialization(assignment.brigadier_id)
        },
        initiator: {
            full_name: assignment.initiator_name || "Системный инициатор"
        }
    }));
    
    res.json({
        success: true,
        data: assignmentsWithBrigadiers
    });
});

// Создать новое назначение
router.post('/', (req, res) => {
    const { brigadier_id, start_date, end_date, initiator_name = "Системный инициатор" } = req.body;
    
    // Валидация
    if (!brigadier_id || !start_date || !end_date) {
        return res.status(400).json({
            success: false,
            error: 'Все поля обязательны для заполнения'
        });
    }
    
    // Проверяем, не занят ли бригадир на эти даты
    const isBrigadierBusy = assignments.some(assignment => {
        if (assignment.brigadier_id === parseInt(brigadier_id) && assignment.status !== 'rejected') {
            const existingStart = new Date(assignment.start_date);
            const existingEnd = new Date(assignment.end_date);
            const newStart = new Date(start_date);
            const newEnd = new Date(end_date);
            
            return newStart <= existingEnd && newEnd >= existingStart;
        }
        return false;
    });
    
    if (isBrigadierBusy) {
        return res.status(400).json({
            success: false,
            error: 'Бригадир уже занят на выбранные даты'
        });
    }
    
    const newAssignment = {
        id: nextAssignmentId++,
        brigadier_id: parseInt(brigadier_id),
        start_date,
        end_date,
        status: 'requested',
        initiator_name,
        created_at: new Date().toISOString(),
        work_days: generateWorkDays(start_date, end_date)
    };
    
    assignments.push(newAssignment);
    
    res.json({
        success: true,
        data: newAssignment
    });
});

// Обновить статус назначения
router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const assignment = assignments.find(a => a.id === parseInt(id));
    
    if (!assignment) {
        return res.status(404).json({
            success: false,
            error: 'Назначение не найдено'
        });
    }
    
    assignment.status = status;
    
    res.json({
        success: true,
        data: assignment
    });
});

// Сбросить данные (для демо)
router.post('/reset', (req, res) => {
    assignments = [];
    nextAssignmentId = 1;
    
    res.json({
        success: true,
        message: 'Данные сброшены'
    });
});

// Вспомогательная функция для генерации рабочих дней
function generateWorkDays(startDate, endDate) {
    const workDays = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        workDays.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workDays;
}

// Вспомогательные функции для получения информации о бригадирах
function getBrigadierName(brigadierId) {
    const brigadiers = {
        1: "Иванов Иван Иванович",
        2: "Петров Петр Петрович",
        3: "Сидоров Алексей Владимирович", 
        4: "Кузнецова Мария Сергеевна",
        5: "Николаев Дмитрий Сергеевич"
    };
    return brigadiers[brigadierId] || "Неизвестный бригадир";
}

function getBrigadierSpecialization(brigadierId) {
    const specializations = {
        1: "садовники",
        2: "декораторы",
        3: "установщик деревьев", 
        4: "специалисты по озеленению",
        5: "старшие садовники"
    };
    return specializations[brigadierId] || "Общие работы";
}

export { router as assignmentsRouter };
