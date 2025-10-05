import { assignmentsAPI } from './api.js';
import { showNotification } from './notifications.js';
import { getSelectedDateRange, showLoadingState, hideLoadingState } from './ui.js';
import { getBrigadierById } from './brigadiers.js';

// Загрузка данных назначений
export async function loadDashboardData() {
    const dateRange = getSelectedDateRange();
    showLoadingState();
    
    try {
        const response = await assignmentsAPI.getAssignments(dateRange);
        console.log('📦 Assignments API response:', response);
        
        // ИСПРАВЛЕНИЕ: Правильно обрабатываем структуру ответа
        const assignments = response.data && response.data.success ? 
                           (Array.isArray(response.data.data) ? response.data.data : []) : [];
        
        console.log('✅ Processed assignments:', assignments);
        
        updateAssignmentsTable(assignments, dateRange);
        updateSummary(assignments, dateRange);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Ошибка загрузки данных', 'error');
        
        // Показываем пустую таблицу при ошибке
        updateAssignmentsTable([], dateRange);
        updateSummary([], dateRange);
    } finally {
        hideLoadingState();
    }
}

// Обновление таблицы назначений
export function updateAssignmentsTable(assignments, dateRange) {
    const tbody = document.getElementById('assignmentsTableBody');
    if (!tbody) return;

    // Убеждаемся что assignments - массив
    if (!Array.isArray(assignments)) {
        assignments = [];
    }

    if (assignments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div style="padding: 40px; color: #7f8c8d;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                        На выбранный период нет назначений
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const groupedByBrigadier = groupAssignmentsByBrigadier(assignments, dateRange);
    
    tbody.innerHTML = Object.values(groupedByBrigadier).map(brigadier => `
        <tr data-brigadier-id="${brigadier.id}">
            <td>
                <strong>${brigadier.full_name}</strong>
            </td>
            <td>
                <span class="specialization-badge">${brigadier.specialization}</span>
            </td>
            <td>
                <span class="status-badge status-${brigadier.overallStatus}">
                    ${getStatusText(brigadier.overallStatus)}
                </span>
                ${brigadier.overallStatus === 'requested' ? `
                    <div style="margin-top: 5px;">
                        <button onclick="confirmAssignment(${brigadier.assignments[0].id})" class="btn btn-sm confirm-btn">Подтвердить</button>
                        <button onclick="rejectAssignment(${brigadier.assignments[0].id})" class="btn btn-sm reject-btn">Отклонить</button>
                    </div>
                ` : ''}
            </td>
            <td>
                ${renderWorkDaysCalendar(brigadier.workDays, dateRange)}
            </td>
            <td>
                ${renderInitiatorsList(brigadier.initiators)}
            </td>
            <td>
                ${renderAssignmentsSummary(brigadier.assignments)}
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showBrigadierDetails(${brigadier.id})">
                    Детали
                </button>
            </td>
        </tr>
    `).join('');
}

// Группировка назначений по бригадирам
function groupAssignmentsByBrigadier(assignments, dateRange) {
    const grouped = {};
    
    // Убеждаемся что assignments - массив
    if (!Array.isArray(assignments)) {
        console.warn('Assignments is not an array:', assignments);
        return {};
    }
    
    assignments.forEach(assignment => {
        // ИСПРАВЛЕНИЕ: Проверяем структуру assignment
        if (!assignment || !assignment.brigadier) {
            console.warn('Invalid assignment structure:', assignment);
            return;
        }
        
        const brigadierId = assignment.brigadier.id;
        
        if (!grouped[brigadierId]) {
            grouped[brigadierId] = {
                id: brigadierId,
                full_name: assignment.brigadier.full_name,
                specialization: assignment.brigadier.specialization,
                assignments: [],
                initiators: new Set(),
                workDays: new Set(),
                statuses: new Set()
            };
        }
        
        const brigadier = grouped[brigadierId];
        brigadier.assignments.push(assignment);
        
        // ИСПРАВЛЕНИЕ: Проверяем наличие initiator
        if (assignment.initiator && assignment.initiator.full_name) {
            brigadier.initiators.add(assignment.initiator.full_name);
        }
        
        // Убеждаемся что work_days - массив
        if (Array.isArray(assignment.work_days)) {
            assignment.work_days.forEach(day => {
                if (day >= dateRange.startDate && day <= dateRange.endDate) {
                    brigadier.workDays.add(day);
                }
            });
        }
        
        if (assignment.status) {
            brigadier.statuses.add(assignment.status);
        }
    });
    
    Object.values(grouped).forEach(brigadier => {
        brigadier.initiators = Array.from(brigadier.initiators);
        brigadier.workDays = Array.from(brigadier.workDays).sort();
        brigadier.overallStatus = calculateOverallStatus(Array.from(brigadier.statuses));
    });
    
    return grouped;
}

// Остальные функции остаются без изменений...
function calculateOverallStatus(statuses) {
    if (statuses.includes('rejected')) return 'rejected';
    if (statuses.includes('requested')) return 'requested';
    return 'confirmed';
}

function renderWorkDaysCalendar(workDays, dateRange) {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    let calendarHTML = '<div class="work-days-calendar">';
    
    for (let i = 0; i < daysInRange; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        const isWorkDay = workDays.includes(dateString);
        const isToday = dateString === new Date().toISOString().split('T')[0];
        
        calendarHTML += `
            <div class="calendar-day ${isWorkDay ? 'work-day' : ''} ${isToday ? 'today' : ''}" 
                 title="${currentDate.toLocaleDateString('ru-RU')}">
                ${currentDate.getDate()}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    return calendarHTML;
}

function renderInitiatorsList(initiators) {
    if (initiators.length === 0) return '<span>Нет данных</span>';
    if (initiators.length === 1) {
        return `<span>${initiators[0]}</span>`;
    }
    
    return `
        <div class="initiators-list">
            <span class="initiators-count">${initiators.length} инициаторов</span>
            <div class="initiators-tooltip">
                ${initiators.map(initiator => `<div>• ${initiator}</div>`).join('')}
            </div>
        </div>
    `;
}

function renderAssignmentsSummary(assignments) {
    if (assignments.length === 0) return '<span>Нет назначений</span>';
    
    const periods = assignments.map(a => 
        a.start_date === a.end_date ? 
        formatDate(a.start_date) : 
        `${formatDate(a.start_date)}-${formatDate(a.end_date)}`
    );
    
    return `
        <div class="assignments-summary">
            <span class="assignments-count">${assignments.length} назначений</span>
            <div class="assignments-tooltip">
                ${periods.map(period => `<div>• ${period}</div>`).join('')}
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU');
}

function getStatusText(status) {
    const statusMap = {
        'requested': 'Отправлен запрос на выход в смену',
        'confirmed': 'Выход подтвержден',
        'rejected': 'Отказ'
    };
    return statusMap[status] || status;
}

// Обновление сводки
export function updateSummary(assignments, dateRange) {
    const summaryElement = document.getElementById('dashboardSummary');
    if (!summaryElement) return;
    
    const uniqueBrigadiers = new Set(assignments.map(a => a.brigadier?.id)).size;
    const totalAssignments = assignments.length;
    const confirmedCount = assignments.filter(a => a.status === 'confirmed').length;
    
    summaryElement.innerHTML = `
        <div class="summary-item">
            <div class="summary-value">${uniqueBrigadiers}</div>
            <div class="summary-label">Бригадиров</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">${totalAssignments}</div>
            <div class="summary-label">Назначений</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">${confirmedCount}</div>
            <div class="summary-label">Подтверждено</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">${dateRange.viewType === 'single' ? formatDate(dateRange.startDate) : `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}</div>
            <div class="summary-label">Период</div>
        </div>
    `;
}

// Функции для интерактивности
export async function confirmAssignment(assignmentId) {
    try {
        await assignmentsAPI.updateStatus(assignmentId, 'confirmed');
        showNotification('Назначение подтверждено', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Ошибка подтверждения', 'error');
    }
}

export async function rejectAssignment(assignmentId) {
    try {
        await assignmentsAPI.updateStatus(assignmentId, 'rejected');
        showNotification('Назначение отклонено', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Ошибка отклонения', 'error');
    }
}

export async function resetData() {
    if (confirm('Вы уверены что хотите сбросить все данные?')) {
        try {
            await assignmentsAPI.resetData();
            showNotification('Данные сброшены', 'success');
            await loadDashboardData();
        } catch (error) {
            showNotification('Ошибка сброса данных', 'error');
        }
    }
}

export function showBrigadierDetails(brigadierId) {
    const brigadier = getBrigadierById(brigadierId);
    if (brigadier) {
        alert(`Детали бригадира:\n\nФИО: ${brigadier.full_name}\nСпециализация: ${brigadier.specialization}\nРоль: ${brigadier.role}\nID: ${brigadier.id}`);
    }
}
