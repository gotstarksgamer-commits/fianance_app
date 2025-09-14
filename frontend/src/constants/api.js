// src/constants/api.js
export const API_BASE_URL = 'http://192.168.0.107:8001/api';

// You can also define other API-related constants here
export const API_ENDPOINTS = {
  DASHBOARD: '/dashboard',
  DASHBOARD_COMPLETE: '/dashboard/complete',
  EXPENSES: '/expenses',
  INCOME: '/income',
  INVESTMENTS: '/investments',
  BUDGETS: '/budgets',
  GOALS: '/goals',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  }
};

// Export a default API object for easy importing
export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
};