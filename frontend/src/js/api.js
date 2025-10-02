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

export default api;
