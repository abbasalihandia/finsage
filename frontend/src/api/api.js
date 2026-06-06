import axios from 'axios';

const API = axios.create({
  baseURL: 'https://finsage-backend-gcv8.onrender.com',
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
export const getMonthlyTrends = () => API.get('/transactions/monthly-trends');

// Upload
export const uploadBankStatement = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post('/upload/bank-statement', formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};