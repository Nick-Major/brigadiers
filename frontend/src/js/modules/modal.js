import { assignmentsAPI } from './api.js';
import { showNotification } from './notifications.js';
import { loadDashboardData } from './assignments.js';
import { populateBrigadierSelect } from './brigadiers.js';

// Инициализация модального окна назначения
export function initializeAssignmentModal() {
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

// Открытие модального окна назначения
export function openAssignmentModal() {
    console.log('🎯 openAssignmentModal FUNCTION EXECUTING');
    
    const modal = document.getElementById('assignmentModal');
    console.log('Modal found:', !!modal);
    
    if (modal) {
        console.log('Before removing hidden - classes:', modal.className);
        modal.classList.remove('hidden');
        console.log('After removing hidden - classes:', modal.className);
        
        // Принудительно устанавливаем display
        modal.style.display = 'flex';
        console.log('After setting display - style.display:', modal.style.display);
        
        // Обновляем список бригадиров при открытии
        populateBrigadierSelect();
    }
}

// Закрытие модального окна
export function closeModal() {
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Обработка отправки формы назначения
export async function handleFormSubmit(e) {
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
