import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const assignmentsAPI = {
    getAssignments: (dateRange) => 
        api.get(`/assignments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
    
    createAssignment: (data) => 
        api.post('/assignments', data),
    
    updateStatus: (assignmentId, status) => 
        api.patch(`/assignments/${assignmentId}/status`, { status }),
    
    resetData: () => 
        api.post('/assignments/reset')
};

export const brigadiersAPI = {
    getBrigadiers: () => 
        api.get('/brigadiers')
};

// Новый API для проверки доступности бригадиров
export const availabilityAPI = {
    // Получить доступных бригадиров на конкретную дату
    getAvailableBrigadiers: (date) => 
        api.get(`/availability/available-brigadiers/${date}`),
    
    // Проверить доступность конкретного бригадира на дату
    checkBrigadierAvailability: (brigadierId, date) => 
        api.get('/availability/check-brigadier-availability', {
            params: { brigadierId, date }
        })
};

export default api;
