import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Transactions
export const addTransaction = (data) => API.post('/transactions/', data);
export const getTransactions = () => API.get('/transactions/');
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const getSummary = () => API.get('/transactions/summary');

// Budgets
export const createBudget = (data) => API.post('/budgets/', data);
export const getBudgets = (month) => API.get(`/budgets/?month=${month}`);
// Chat
export const askAI = (message) => API.post('/chat/ask', { message });