import { brigadiersAPI, availabilityAPI } from './api.js';
import { showNotification } from './notifications.js';

// Глобальные переменные для бригадиров
export let availableBrigadiers = [];

// Загрузка списка бригадиров
export async function loadBrigadiers() {
    try {
        console.log('🔄 Loading brigadiers...');
        const response = await brigadiersAPI.getBrigadiers();
        console.log('📦 Brigadiers API response:', response);
        
        availableBrigadiers = response.data.data || [];
        
        console.log('✅ Processed brigadiers:', availableBrigadiers);
        populateBrigadierSelect();
    } catch (error) {
        console.error('❌ Error loading brigadiers:', error);
        availableBrigadiers = [
            { id: 1, full_name: "Иванов Иван Иванович", specialization: "Администратор" },
            { id: 2, full_name: "Петров Петр Петрович", specialization: "Администратор" },
            { id: 3, full_name: "Сидоров Алексей Владимирович", specialization: "Администратор" },
            { id: 4, full_name: "Кузнецова Мария Сергеевна", specialization: "Специалист по озеленению" }
        ];
        populateBrigadierSelect();
        showNotification('Ошибка загрузки списка бригадиров', 'error');
    }
}

// Заполнение выпадающего списка бригадиров для назначения
export function populateBrigadierSelect() {
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
    } else {
        console.error('❌ Available brigadiers is empty or not array:', availableBrigadiers);
    }
}

// Заполнение списка бригадиров для заявок (только доступные на выбранную дату)
export async function populateRequestBrigadierSelect(selectedDate) {
    const select = document.getElementById('requestBrigadierSelect');
    if (!select) return;

    try {
        select.innerHTML = '<option value="">Загрузка доступных бригадиров...</option>';
        
        const response = await availabilityAPI.getAvailableBrigadiers(selectedDate);
        console.log('Available brigadiers response:', response);
        
        let availableBrigadiers = response.data.data || [];
        
        console.log('Final availableBrigadiers for date:', selectedDate, availableBrigadiers);
        
        select.innerHTML = '<option value="">Выберите бригадира</option>';
        
        if (availableBrigadiers.length === 0) {
            select.innerHTML += '<option value="" disabled>Нет доступных бригадиров на выбранную дату</option>';
            showNotification('На выбранную дату нет доступных бригадиров. Сначала назначьте бригадиров во вкладке "Бригадиры".', 'warning');
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
        showNotification('Ошибка загрузки списка доступных бригадиров', 'error');
    }
}

// Получение бригадира по ID
export function getBrigadierById(brigadierId) {
    return availableBrigadiers.find(b => b.id === brigadierId);
}