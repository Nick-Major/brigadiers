import { loadDashboardData } from './assignments.js';
import { loadRequestsData } from './requests.js';

// Глобальные переменные
export let currentView = 'brigadiers';

// Инициализация UI компонентов
export function initializeUI() {
    initializeDateControls();
    initializeTabs();
    initializeRequestFilters();
}

// Инициализация фильтров заявок
export function initializeRequestFilters() {
    const requestFilter = document.getElementById('requestFilter');
    const requestSearch = document.getElementById('requestSearch');
    
    if (requestFilter) {
        requestFilter.addEventListener('change', loadRequestsData);
    }
    
    if (requestSearch) {
        requestSearch.addEventListener('input', loadRequestsData);
    }
}

// Получить текущие настройки фильтра заявок
export function getRequestFilterSettings() {
    return {
        filter: document.getElementById('requestFilter')?.value || 'my',
        search: document.getElementById('requestSearch')?.value || ''
    };
}

// Инициализация контролов даты
export function initializeDateControls() {
    const viewType = document.getElementById('viewType');
    const singleDateGroup = document.getElementById('singleDateGroup');
    const dateRangeGroup = document.getElementById('dateRangeGroup');
    
    if (viewType) {
        viewType.addEventListener('change', function() {
            const isRangeView = this.value === 'range';
            
            // Переключаем видимость групп
            if (isRangeView) {
                singleDateGroup.classList.add('hidden');
                dateRangeGroup.classList.remove('hidden');
            } else {
                singleDateGroup.classList.remove('hidden');
                dateRangeGroup.classList.add('hidden');
            }
            
            // Загружаем данные при любом изменении типа просмотра
            loadDashboardData();
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
            // Загружаем данные при изменении начальной даты
            if (viewType.value === 'range') {
                loadDashboardData();
            }
        });
        
        endDatePicker.addEventListener('change', function() {
            // Загружаем данные при изменении конечной даты
            if (viewType.value === 'range') {
                loadDashboardData();
            }
        });
    }
}

// Инициализация вкладок
export function initializeTabs() {
    const tabBrigadiers = document.getElementById('tabBrigadiers');
    const tabRequests = document.getElementById('tabRequests');

    if (tabBrigadiers && tabRequests) {
        tabBrigadiers.addEventListener('click', () => switchTab('brigadiers'));
        tabRequests.addEventListener('click', () => switchTab('requests'));
    }
}

// Переключение вкладок
export function switchTab(tab) {
    const brigadiersTab = document.getElementById('brigadiersTab');
    const requestsTab = document.getElementById('requestsTab');
    const tabBrigadiers = document.getElementById('tabBrigadiers');
    const tabRequests = document.getElementById('tabRequests');
    const dateControls = document.querySelector('.control-panel');

    currentView = tab;

    if (tab === 'brigadiers') {
        brigadiersTab.classList.remove('hidden');
        requestsTab.classList.add('hidden');
        
        // Активная вкладка
        tabBrigadiers.classList.add('active-tab');
        tabBrigadiers.classList.remove('inactive-tab');
        
        // Неактивная вкладка
        tabRequests.classList.remove('active-tab');
        tabRequests.classList.add('inactive-tab');
        
        // Показываем контролы дат для бригадиров
        if (dateControls) dateControls.style.display = 'flex';
        
        // Загружаем данные при переключении на вкладку бригадиров
        loadDashboardData();
        
    } else {
        brigadiersTab.classList.add('hidden');
        requestsTab.classList.remove('hidden');
        
        // Активная вкладка
        tabRequests.classList.add('active-tab');
        tabRequests.classList.remove('inactive-tab');
        
        // Неактивная вкладка
        tabBrigadiers.classList.remove('active-tab');
        tabBrigadiers.classList.add('inactive-tab');
        
        // Скрываем контролы дат для заявок
        if (dateControls) dateControls.style.display = 'none';
        
        loadRequestsData();
    }
}

// Получение выбранного диапазона дат
export function getSelectedDateRange() {
    const viewType = document.getElementById('viewType')?.value || 'single';
    
    if (viewType === 'single') {
        const date = document.getElementById('datePicker').value;
        return { startDate: date, endDate: date, viewType: 'single' };
    } else {
        const startDate = document.getElementById('startDatePicker').value;
        const endDate = document.getElementById('endDatePicker').value;
        
        // Если даты не выбраны, используем значения по умолчанию
        if (!startDate || !endDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const defaultStart = tomorrow.toISOString().split('T')[0];
            const defaultEnd = new Date(tomorrow.setDate(tomorrow.getDate() + 6)).toISOString().split('T')[0];
            
            return {
                startDate: defaultStart,
                endDate: defaultEnd,
                viewType: 'range'
            };
        }
        
        return {
            startDate: startDate,
            endDate: endDate,
            viewType: 'range'
        };
    }
}

// Показать состояние загрузки
export function showLoadingState() {
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

// Скрыть состояние загрузки
export function hideLoadingState() {
    // Убираем состояние загрузки
}
