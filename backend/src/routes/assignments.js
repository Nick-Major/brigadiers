import express from 'express';
const router = express.Router();

// Хранилище назначений (в памяти) - делаем экспортируемым
export let assignments = [];
export let assignedBrigadiers = []; // Новое хранилище для назначенных бригадиров
let nextAssignmentId = 1;

// База данных всех бригадиров (должна быть синхронизирована с brigadiers.js)
const allBrigadiers = [
    { id: 1, full_name: "Иванов Иван Иванович", specialization: "садовники" },
    { id: 2, full_name: "Петров Петр Петрович", specialization: "декораторы" },
    { id: 3, full_name: "Сидоров Алексей Владимирович", specialization: "установщик деревьев" },
    { id: 4, full_name: "Кузнецова Мария Сергеевна", specialization: "специалисты по озеленению" },
    { id: 5, full_name: "Николаев Дмитрий Сергеевич", specialization: "старшие садовники" }
];

// Функция для обновления списка назначенных бригадиров
function updateAssignedBrigadiers() {
    assignedBrigadiers = [];
    
    assignments.forEach(assignment => {
        if (assignment.status === 'confirmed') {
            const brigadier = allBrigadiers.find(b => b.id === assignment.brigadier_id);
            if (brigadier) {
                // Добавляем бригадира для каждой даты в периоде
                const startDate = new Date(assignment.start_date);
                const endDate = new Date(assignment.end_date);
                
                for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                    const dateString = date.toISOString().split('T')[0];
                    assignedBrigadiers.push({
                        date: dateString,
                        brigadier_id: assignment.brigadier_id,
                        full_name: brigadier.full_name,
                        specialization: brigadier.specialization,
                        assignment_id: assignment.id
                    });
                }
            }
        }
    });
    
    console.log('📋 Обновлен список назначенных бригадиров:', assignedBrigadiers);
}

// Получить всех назначенных бригадиров на дату
export function getAssignedBrigadiersForDate(date) {
    return assignedBrigadiers.filter(item => item.date === date);
}

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
        status: 'requested', // По умолчанию "отправлен запрос"
        initiator_name,
        created_at: new Date().toISOString(),
        work_days: generateWorkDays(start_date, end_date)
    };
    
    assignments.push(newAssignment);
    
    // ОБНОВЛЯЕМ список назначенных бригадиров
    updateAssignedBrigadiers();
    
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
    
    // ОБНОВЛЯЕМ список назначенных бригадиров при изменении статуса
    updateAssignedBrigadiers();
    
    res.json({
        success: true,
        data: assignment
    });
});

// Сбросить данные (для демо)
router.post('/reset', (req, res) => {
    assignments = [];
    assignedBrigadiers = []; // Сбрасываем и назначенных бригадиров
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
    const brigadier = allBrigadiers.find(b => b.id === brigadierId);
    return brigadier ? brigadier.full_name : "Неизвестный бригадир";
}

function getBrigadierSpecialization(brigadierId) {
    const brigadier = allBrigadiers.find(b => b.id === brigadierId);
    return brigadier ? brigadier.specialization : "Общие работы";
}

// Инициализируем список при запуске
updateAssignedBrigadiers();

export { router as assignmentsRouter };
