import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

// Add auth token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.patch('/auth/profile', data),
    updateOrg: (data) => api.patch('/auth/organization', data),
};

// Customers
export const customerAPI = {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// Items
export const itemAPI = {
    getAll: (params) => api.get('/items', { params }),
    getById: (id) => api.get(`/items/${id}`),
    create: (data) => api.post('/items', data),
    update: (id, data) => api.put(`/items/${id}`, data),
    delete: (id) => api.delete(`/items/${id}`),
};

// Invoices
export const invoiceAPI = {
    getAll: (params) => api.get('/invoices', { params }),
    getById: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    update: (id, data) => api.put(`/invoices/${id}`, data),
    delete: (id) => api.delete(`/invoices/${id}`),
};

// Quotes
export const quoteAPI = {
    getAll: (params) => api.get('/quotes', { params }),
    getById: (id) => api.get(`/quotes/${id}`),
    create: (data) => api.post('/quotes', data),
    update: (id, data) => api.put(`/quotes/${id}`, data),
    delete: (id) => api.delete(`/quotes/${id}`),
    convert: (id, data) => api.post(`/quotes/${id}/convert`, data),
};

// Payments
export const paymentAPI = {
    getAll: (params) => api.get('/payments', { params }),
    getById: (id) => api.get(`/payments/${id}`),
    create: (data) => api.post('/payments', data),
};

// Expenses
export const expenseAPI = {
    getAll: (params) => api.get('/expenses', { params }),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

// Time Tracking
export const timeAPI = {
    getAll: (params) => api.get('/time-tracking', { params }),
    create: (data) => api.post('/time-tracking', data),
    update: (id, data) => api.put(`/time-tracking/${id}`, data),
    delete: (id) => api.delete(`/time-tracking/${id}`),
};

// Reports
export const reportAPI = {
    sales: () => api.get('/reports/sales'),
    expenses: () => api.get('/reports/expenses'),
    aging: () => api.get('/reports/aging'),
    tax: () => api.get('/reports/tax'),
};

export default api;
