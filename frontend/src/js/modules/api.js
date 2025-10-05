import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавляем обработчик ошибок
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

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

export const availabilityAPI = {
    getAvailableBrigadiers: (date) => 
        api.get(`/availability/available-brigadiers/${date}`)  // Исправленный путь
};

export default api;
