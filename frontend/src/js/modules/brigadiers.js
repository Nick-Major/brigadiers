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
            { id: 1, full_name: "Иванов Иван Иванович", specialization: "Строительные работы" },
            { id: 2, full_name: "Петров Петр Петрович", specialization: "Отделочные работы" }
        ];
        populateBrigadierSelect();
        showNotification('Ошибка загрузки списка бригадиров', 'error');
    }
}

// Заполнение выпадающего списка бригадиров
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

// Заполнение списка бригадиров для заявок
export async function populateRequestBrigadierSelect(selectedDate) {
    const select = document.getElementById('requestBrigadierSelect');
    if (!select) return;

    try {
        select.innerHTML = '<option value="">Загрузка доступных бригадиров...</option>';
        
        const response = await availabilityAPI.getAvailableBrigadiers(selectedDate);
        console.log('Full response:', response);
        
        let availableBrigadiers = [];
        
        if (Array.isArray(response.data)) {
            availableBrigadiers = response.data;
        } else if (Array.isArray(response.data?.data)) {
            availableBrigadiers = response.data.data;
        } else if (Array.isArray(response.data?.brigadiers)) {
            availableBrigadiers = response.data.brigadiers;
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

// Получение бригадира по ID
export function getBrigadierById(brigadierId) {
    return availableBrigadiers.find(b => b.id === brigadierId);
}
