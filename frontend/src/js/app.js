import { assignmentsAPI, brigadiersAPI, availabilityAPI } from './api.js';

// Глобальные переменные для заявок
let requests = JSON.parse(localStorage.getItem('requests')) || [];
let currentView = 'brigadiers'; // 'brigadiers' | 'requests'

// Глобальные переменные
let availableBrigadiers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// В НАЧАЛЕ app.js, перед всеми другими функциями
window.openAssignmentModal = function() {
    console.log('=== openAssignmentModal called ===');
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('Modal opened - hidden class removed');
    }
}

window.closeModal = function() {
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function initializeDashboard() {
    await loadBrigadiers();
    initializeDateControls();
    initializeModal();
    initializeTabs();
    loadDashboardData();
    updateSummary([], getSelectedDateRange());
}

// Загрузка списка бригадиров
async function loadBrigadiers() {
    try {
        console.log('🔄 Loading brigadiers...');
        const response = await brigadiersAPI.getBrigadiers();
        console.log('📦 Brigadiers API response:', response);
        
        // ИСПРАВЛЕНА ОБРАБОТКА ОТВЕТА - response.data.data
        availableBrigadiers = response.data.data || [];
        
        console.log('✅ Processed brigadiers:', availableBrigadiers);
        populateBrigadierSelect();
    } catch (error) {
        console.error('❌ Error loading brigadiers:', error);
        availableBrigadiers = [
            { id: 1, full_name: "Иванов Иван Иванович", specialization: "Строительные работы" },
            { id: 2, full_name: "Петров Петр Петрович", specialization: "Отделочные работы" }
        ];
        populateBrigadierSelect();
        showNotification('Ошибка загрузки списка бригадиров', 'error');
    }
}

function populateBrigadierSelect() {
    console.log('🎯 populateBrigadierSelect CALLED');
    
    const brigadierSelect = document.getElementById('id_brigadier');
    console.log('Brigadier select element:', brigadierSelect);
    console.log('Available brigadiers:', availableBrigadiers);
    
    if (!brigadierSelect) {
        console.error('❌ Brigadier select element not found!');
        return;
    }

    // Очищаем существующие опции, кроме первой
    brigadierSelect.innerHTML = '<option value="">Выберите бригадира</option>';
    console.log('Select cleared');
    
    // Убедимся что availableBrigadiers - массив
    if (Array.isArray(availableBrigadiers) && availableBrigadiers.length > 0) {
        console.log('✅ Populating select with', availableBrigadiers.length, 'brigadiers');
        
        availableBrigadiers.forEach((brigadier, index) => {
            console.log(`Adding brigadier ${index + 1}:`, brigadier);
            const option = document.createElement('option');
            option.value = brigadier.id;
            option.textContent = `${brigadier.full_name} (${brigadier.specialization})`;
            brigadierSelect.appendChild(option);
        });
        
        console.log('✅ Final select options count:', brigadierSelect.options.length);
        console.log('✅ Select HTML:', brigadierSelect.innerHTML);
    } else {
        console.error('❌ Available brigadiers is empty or not array:', availableBrigadiers);
    }
}

// ДОБАВЬТЕ ЭТУ ФУНКЦИЮ (она отсутствует)
function initializeWorkerTypeLogic() {
    const specialtySelect = document.querySelector('select[name="specialty"]');
    const workerTypeSelect = document.getElementById('workerTypeSelect');
    
    if (specialtySelect && workerTypeSelect) {
        specialtySelect.addEventListener('change', function() {
            const specialty = this.value;
            workerTypeSelect.innerHTML = '<option value="">Выберите тип</option>';
            
            // Для демо просто покажем оба варианта
            workerTypeSelect.innerHTML += `
                <option value="наш сотрудник">Наш сотрудник</option>
                <option value="от подрядчика">От подрядчика</option>
            `;
        });
    }
    
    // Логика для автоматического определения компании-плательщика
    const projectSelect = document.querySelector('select[name="project"]');
    const assignmentSelect = document.querySelector('select[name="assignment"]');
    const payerCompany = document.getElementById('payerCompany');
    
    if (projectSelect && assignmentSelect && payerCompany) {
        const updatePayerCompany = () => {
            const project = projectSelect.value;
            const assignment = assignmentSelect.value;
            
            if (project && assignment) {
                if (assignment === 'Застройка') {
                    payerCompany.value = 'ЦЕХ/БС';
                } else if (assignment === 'Уход') {
                    payerCompany.value = 'УС';
                } else if (assignment === 'Растения') {
                    payerCompany.value = 'ЦО';
                } else {
                    payerCompany.value = 'ЦФ';
                }
            } else {
                payerCompany.value = '';
            }
        };
        
        projectSelect.addEventListener('change', updatePayerCompany);
        assignmentSelect.addEventListener('change', updatePayerCompany);
    }
}

async function populateRequestBrigadierSelect(selectedDate) {
    const select = document.getElementById('requestBrigadierSelect');
    if (!select) return;

    try {
        select.innerHTML = '<option value="">Загрузка доступных бригадиров...</option>';
        
        const response = await availabilityAPI.getAvailableBrigadiers(selectedDate);
        console.log('Full response:', response);
        console.log('Response data:', response.data);
        console.log('Response data.data:', response.data?.data);
        
        // ДИАГНОСТИКА: проверяем разные варианты структуры
        let availableBrigadiers = [];
        
        if (Array.isArray(response.data)) {
            availableBrigadiers = response.data; // если ответ сразу массив
        } else if (Array.isArray(response.data?.data)) {
            availableBrigadiers = response.data.data; // если ответ { data: [...] }
        } else if (Array.isArray(response.data?.brigadiers)) {
            availableBrigadiers = response.data.brigadiers; // альтернативная структура
        }
        
        console.log('Final availableBrigadiers:', availableBrigadiers);
        
        select.innerHTML = '<option value="">Выберите бригадира</option>';
        
        if (availableBrigadiers.length === 0) {
            select.innerHTML += '<option value="" disabled>Нет доступных бригадиров на выбранную дату</option>';
        } else {
            availableBrigadiers.forEach(brigadier => {
                const option = document.createElement('option');
                option.value = brigadier.id;
                option.textContent = `${brigadier.full_name} (${brigadier.specialization})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading available brigadiers:', error);
        select.innerHTML = '<option value="">Ошибка загрузки бригадиров</option>';
        
        // Демо-данные на случай ошибки
        select.innerHTML += `
            <option value="1">Иванов Иван (Строительные работы)</option>
            <option value="2">Петров Петр (Отделочные работы)</option>
        `;
    }
}

function initializeDateControls() {
    const viewType = document.getElementById('viewType');
    const singleDateGroup = document.getElementById('singleDateGroup');
    const dateRangeGroup = document.getElementById('dateRangeGroup');
    
    if (viewType) {
        viewType.addEventListener('change', function() {
            const isRangeView = this.value === 'range';
            singleDateGroup.style.display = isRangeView ? 'none' : 'block';
            dateRangeGroup.style.display = isRangeView ? 'block' : 'none';
            
            if (!isRangeView) {
                loadDashboardData();
            }
        });
    }

    // Одиночная дата
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        datePicker.min = tomorrow.toISOString().split('T')[0];
        datePicker.value = tomorrow.toISOString().split('T')[0];
        datePicker.addEventListener('change', () => loadDashboardData());
    }

    // Период
    const startDatePicker = document.getElementById('startDatePicker');
    const endDatePicker = document.getElementById('endDatePicker');
    
    if (startDatePicker && endDatePicker) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        startDatePicker.min = tomorrow.toISOString().split('T')[0];
        endDatePicker.min = tomorrow.toISOString().split('T')[0];
        
        startDatePicker.value = tomorrow.toISOString().split('T')[0];
        endDatePicker.value = new Date(tomorrow.setDate(tomorrow.getDate() + 6)).toISOString().split('T')[0];
        
        startDatePicker.addEventListener('change', function() {
            endDatePicker.min = this.value;
            if (new Date(this.value) > new Date(endDatePicker.value)) {
                endDatePicker.value = this.value;
            }
            if (viewType.value === 'range') loadDashboardData();
        });
        
        endDatePicker.addEventListener('change', function() {
            if (viewType.value === 'range') loadDashboardData();
        });
    }
}

function initializeModal() {
    const modal = document.getElementById('assignmentModal');
    if (!modal) return;

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    const form = document.getElementById('assignmentForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        // Установка минимальных дат
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        
        const startDateInput = document.getElementById('id_start_date');
        const endDateInput = document.getElementById('id_end_date');
        
        if (startDateInput) startDateInput.min = dateString;
        if (endDateInput) endDateInput.min = dateString;
    }
}

function getSelectedDateRange() {
    const viewType = document.getElementById('viewType')?.value || 'single';
    
    if (viewType === 'single') {
        const date = document.getElementById('datePicker').value;
        return { startDate: date, endDate: date, viewType: 'single' };
    } else {
        return {
            startDate: document.getElementById('startDatePicker').value,
            endDate: document.getElementById('endDatePicker').value,
            viewType: 'range'
        };
    }
}

// Инициализация вкладок
function initializeTabs() {
    const tabBrigadiers = document.getElementById('tabBrigadiers');
    const tabRequests = document.getElementById('tabRequests');

    if (tabBrigadiers && tabRequests) {
        tabBrigadiers.addEventListener('click', () => switchTab('brigadiers'));
        tabRequests.addEventListener('click', () => switchTab('requests'));
    }

    // Инициализация модального окна заявки
    initializeRequestModal();
    
    // Загрузка данных заявок
    loadRequestsData();
}

// Переключение вкладок
function switchTab(tab) {
    const brigadiersTab = document.getElementById('brigadiersTab');
    const requestsTab = document.getElementById('requestsTab');
    const tabBrigadiers = document.getElementById('tabBrigadiers');
    const tabRequests = document.getElementById('tabRequests');
    const dateControls = document.querySelector('.control-panel');

    currentView = tab;

    if (tab === 'brigadiers') {
        brigadiersTab.classList.remove('hidden');
        requestsTab.classList.add('hidden');
        
        // Активная вкладка - синяя
        tabBrigadiers.classList.add('bg-blue-500', 'text-white');
        tabBrigadiers.classList.remove('text-gray-700', 'hover:bg-gray-300');
        
        // Неактивная вкладка - серая
        tabRequests.classList.remove('bg-blue-500', 'text-white');
        tabRequests.classList.add('text-gray-700', 'hover:bg-gray-300');
        
        // Показываем контролы дат для бригадиров
        if (dateControls) dateControls.style.display = 'flex';
        
    } else {
        brigadiersTab.classList.add('hidden');
        requestsTab.classList.remove('hidden');
        
        // Активная вкладка - синяя
        tabRequests.classList.add('bg-blue-500', 'text-white');
        tabRequests.classList.remove('text-gray-700', 'hover:bg-gray-300');
        
        // Неактивная вкладка - серая
        tabBrigadiers.classList.remove('bg-blue-500', 'text-white');
        tabBrigadiers.classList.add('text-gray-700', 'hover:bg-gray-300');
        
        // Скрываем контролы дат для заявок
        if (dateControls) dateControls.style.display = 'none';
        
        loadRequestsData();
    }
}

// Инициализация модального окна заявки
function initializeRequestModal() {
    const modal = document.getElementById('requestModal');
    const cancelBtn = document.getElementById('cancelRequestBtn');
    const createBtn = document.getElementById('createRequestBtn');

    if (modal && cancelBtn) {
        cancelBtn.addEventListener('click', closeRequestModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRequestModal();
            }
        });
    }

    if (createBtn) {
        createBtn.addEventListener('click', openRequestModal);
    }

    const form = document.getElementById('requestForm');
    if (form) {
        form.addEventListener('submit', handleRequestSubmit);
        
        // Добавляем обработчик изменения даты - ОБНОВЛЯЕМ список бригадиров
        const dateInput = form.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.addEventListener('change', function() {
                if (this.value) {
                    populateRequestBrigadierSelect(this.value);
                }
            });
        }
    }
    
    // Инициализируем логику для типа исполнителя и компании-плательщика
    initializeWorkerTypeLogic();
}

// Открытие модального окна заявки
function openRequestModal() {
    const modal = document.getElementById('requestModal');
    if (modal) {
        // Заполняем список доступных бригадиров на сегодня+1 (по умолчанию)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDate = tomorrow.toISOString().split('T')[0];
        
        // Устанавливаем дату по умолчанию в форму
        const dateInput = modal.querySelector('input[name="date"]');
        if (dateInput) {
            dateInput.value = defaultDate;
        }
        
        // Используем новую функцию для заполнения списка бригадиров
        populateRequestBrigadierSelect(defaultDate);
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна заявки
function closeRequestModal() {
    const modal = document.getElementById('requestModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        
        const form = document.getElementById('requestForm');
        if (form) form.reset();
    }
}

// Обработка отправки формы заявки
function handleRequestSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const requestData = Object.fromEntries(formData.entries());
    
    // Добавляем заявку
    addRequest(requestData);
    
    // Закрываем модальное окно
    closeRequestModal();
    
    // Показываем уведомление
    showNotification('Заявка успешно опубликована', 'success');
}

// Добавление заявки
function addRequest(requestData) {
    const newRequest = {
        id: Date.now().toString(),
        status: 'Опубликовано',
        ...requestData,
        createdAt: new Date().toISOString()
    };
    
    requests.push(newRequest);
    saveRequestsToStorage();
    loadRequestsData();
    
    return newRequest;
}

// Сохранение заявок в localStorage
function saveRequestsToStorage() {
    localStorage.setItem('requests', JSON.stringify(requests));
}

// Загрузка данных заявок
function loadRequestsData() {
    try {
        const tbody = document.getElementById('requestsTableBody');
        if (!tbody) return;

        // Загружаем актуальные данные из localStorage
        requests = JSON.parse(localStorage.getItem('requests')) || [];

        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        Нет созданных заявок. Нажмите "Оформить заявку" чтобы создать первую.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(request => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${request.date} ${request.time}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${request.address || 'Не указан'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${request.specialty || 'Не указана'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${request.workersCount || 1}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ${request.status}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading requests data:', error);
    }
}

async function loadDashboardData() {
    const dateRange = getSelectedDateRange();
    showLoadingState();
    
    try {
        const response = await assignmentsAPI.getAssignments(dateRange);
        const assignments = response.data;
        updateAssignmentsTable(assignments, dateRange);
        updateSummary(assignments, dateRange);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Ошибка загрузки данных', 'error');
    } finally {
        hideLoadingState();
    }
}

function updateAssignmentsTable(assignments, dateRange) {
    const tbody = document.getElementById('assignmentsTableBody');
    if (!tbody) return;

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
                        <button onclick="confirmAssignment(${brigadier.assignments[0].id})" class="btn btn-sm" style="background: #27ae60; color: white; padding: 2px 8px; font-size: 10px;">Подтвердить</button>
                        <button onclick="rejectAssignment(${brigadier.assignments[0].id})" class="btn btn-sm" style="background: #e74c3c; color: white; padding: 2px 8px; font-size: 10px;">Отклонить</button>
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

function groupAssignmentsByBrigadier(assignments, dateRange) {
    const grouped = {};
    
    assignments.forEach(assignment => {
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
        brigadier.initiators.add(assignment.initiator.full_name);
        
        assignment.work_days.forEach(day => {
            if (day >= dateRange.startDate && day <= dateRange.endDate) {
                brigadier.workDays.add(day);
            }
        });
        
        brigadier.statuses.add(assignment.status);
    });
    
    Object.values(grouped).forEach(brigadier => {
        brigadier.initiators = Array.from(brigadier.initiators);
        brigadier.workDays = Array.from(brigadier.workDays).sort();
        brigadier.overallStatus = calculateOverallStatus(Array.from(brigadier.statuses));
    });
    
    return grouped;
}

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

function updateSummary(assignments, dateRange) {
    const summaryElement = document.getElementById('dashboardSummary');
    if (!summaryElement) return;
    
    const uniqueBrigadiers = new Set(assignments.map(a => a.brigadier.id)).size;
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

function getStatusText(status) {
    const statusMap = {
        'requested': 'Отправлен запрос',
        'confirmed': 'Выход подтвержден',
        'rejected': 'Отказ'
    };
    return statusMap[status] || status;
}

function showLoadingState() {
    const tbody = document.getElementById('assignmentsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div style="padding: 40px;">
                        <div class="loading-spinner"></div>
                        <div style="margin-top: 16px; color: #7f8c8d;">Загрузка данных...</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideLoadingState() {
    // Убираем состояние загрузки
}

function openAssignmentModal() {
    console.log('🎯 openAssignmentModal FUNCTION EXECUTING');
    console.trace(); // ← покажет откуда вызывается
    
    const modal = document.getElementById('assignmentModal');
    console.log('Modal found:', !!modal);
    
    if (modal) {
        console.log('Before removing hidden - classes:', modal.className);
        modal.classList.remove('hidden');
        console.log('After removing hidden - classes:', modal.className);
        
        // Принудительно устанавливаем display
        modal.style.display = 'flex';
        console.log('After setting display - style.display:', modal.style.display);
    }
}

function closeModal() {
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const brigadierId = parseInt(formData.get('brigadier'));
    const startDate = formData.get('start_date');
    const endDate = formData.get('end_date');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        showNotification('Дата окончания не может быть раньше даты начала', 'error');
        return;
    }
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Сохранение...';
    submitButton.disabled = true;
    
    try {
        await assignmentsAPI.createAssignment({
            brigadier_id: brigadierId,
            start_date: startDate,
            end_date: endDate
        });
        
        showNotification('Бригадир успешно назначен', 'success');
        closeModal();
        form.reset();
        await loadDashboardData();
    } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'Ошибка при назначении бригадира';
        showNotification(errorMessage, 'error');
        console.error('Form submission error:', error);
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Функции для интерактивности
async function confirmAssignment(assignmentId) {
    try {
        await assignmentsAPI.updateStatus(assignmentId, 'confirmed');
        showNotification('Назначение подтверждено', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Ошибка подтверждения', 'error');
    }
}

async function rejectAssignment(assignmentId) {
    try {
        await assignmentsAPI.updateStatus(assignmentId, 'rejected');
        showNotification('Назначение отклонено', 'success');
        await loadDashboardData();
    } catch (error) {
        showNotification('Ошибка отклонения', 'error');
    }
}

async function resetData() {
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

function showBrigadierDetails(brigadierId) {
    const brigadier = availableBrigadiers.find(b => b.id === brigadierId);
    if (brigadier) {
        alert(`Детали бригадира:\n\nФИО: ${brigadier.full_name}\nСпециализация: ${brigadier.specialization}\nID: ${brigadier.id}`);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Глобальные функции
window.openAssignmentModal = openAssignmentModal;
window.closeModal = closeModal;
window.confirmAssignment = confirmAssignment;
window.rejectAssignment = rejectAssignment;
window.resetData = resetData;
window.showBrigadierDetails = showBrigadierDetails;
window.openRequestModal = openRequestModal;
window.closeRequestModal = closeRequestModal;
window.switchTab = switchTab;
window.loadRequestsData = loadRequestsData;
