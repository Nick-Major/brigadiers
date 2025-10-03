// Импорт модулей
import { assignmentsAPI, brigadiersAPI, availabilityAPI } from './modules/api.js';
import { initializeUI, switchTab } from './modules/ui.js';
import { loadBrigadiers, availableBrigadiers, getBrigadierById } from './modules/brigadiers.js';
import { initializeAssignmentModal, openAssignmentModal, closeModal, handleFormSubmit } from './modules/modal.js';
import { initializeRequestModal, openRequestModal, closeRequestModal, loadRequestsData } from './modules/requests.js';
import { loadDashboardData, confirmAssignment, rejectAssignment, resetData, showBrigadierDetails } from './modules/assignments.js';
import { showNotification } from './modules/notifications.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await loadBrigadiers();
        initializeUI();
        initializeAssignmentModal();
        initializeRequestModal();
        await loadDashboardData();
        loadRequestsData();
        
        console.log('✅ Приложение инициализировано');
    } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        showNotification('Ошибка инициализации приложения', 'error');
    }
}

// Экспорт глобальных функций
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
