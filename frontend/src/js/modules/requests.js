import { showNotification } from './notifications.js';
import { populateRequestBrigadierSelect } from './brigadiers.js';
import { getRequestFilterSettings } from './ui.js';

// Глобальные переменные для заявок
export let requests = JSON.parse(localStorage.getItem('requests')) || [];

// Инициализация модального окна заявки
export function initializeRequestModal() {
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
        
        // Добавляем обработчик изменения даты
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
export function openRequestModal() {
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
export function closeRequestModal() {
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
export function handleRequestSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const requestData = Object.fromEntries(formData.entries());
    
    // Добавляем информацию об инициаторе
    requestData.initiator = "Текущий пользователь"; // В реальной системе - данные авторизации
    
    // Добавляем заявку
    addRequest(requestData);
    
    // Закрываем модальное окно
    closeRequestModal();
    
    // Показываем уведомление
    showNotification('Заявка успешно опубликована', 'success');
}

// Добавление заявки
export function addRequest(requestData) {
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
export function saveRequestsToStorage() {
    localStorage.setItem('requests', JSON.stringify(requests));
}

// Загрузка данных заявок с фильтрацией
export function loadRequestsData() {
    try {
        const tbody = document.getElementById('requestsTableBody');
        if (!tbody) return;

        // Загружаем актуальные данные из localStorage
        requests = JSON.parse(localStorage.getItem('requests')) || [];

        // Применяем фильтры
        const filterSettings = getRequestFilterSettings();
        let filteredRequests = requests;

        // Фильтр по принадлежности
        if (filterSettings.filter === 'my') {
            filteredRequests = filteredRequests.filter(request => 
                request.initiator === "Текущий пользователь"
            );
        }

        // Поиск
        if (filterSettings.search) {
            const searchTerm = filterSettings.search.toLowerCase();
            filteredRequests = filteredRequests.filter(request =>
                request.address?.toLowerCase().includes(searchTerm) ||
                getBrigadierName(request.brigadier)?.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" class="px-6 py-8 text-center text-gray-500">
                        ${requests.length === 0 ? 
                            'Нет созданных заявок. Нажмите "Оформить заявку" чтобы создать первую.' : 
                            'Заявки по вашему запросу не найдены.'
                        }
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredRequests.map(request => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.date}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.time}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${request.address || 'Не указан'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${getBrigadierName(request.brigadier)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.specialty || 'Не указана'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.workersCount || 1}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.workerType || 'Не указан'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${request.workType || 'Не указан'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.duration || 'Не указана'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${request.comment || 'Нет комментария'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.project || 'Не указан'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.assignment || 'Не указано'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${request.payerCompany || 'Не указана'}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="status-badge status-published">${request.status}</span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading requests data:', error);
    }
}

// Получить имя бригадира по ID
function getBrigadierName(brigadierId) {
    const brigadiers = {
        '1': 'Иванов Иван Иванович',
        '2': 'Петров Петр Петрович', 
        '3': 'Сидоров Алексей Владимирович',
        '4': 'Кузнецова Мария Сергеевна',
        '5': 'Николаев Дмитрий Сергеевич'
    };
    return brigadiers[brigadierId] || 'Контактное лицо';
}

// Логика для типа исполнителя и компании-плательщика
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
