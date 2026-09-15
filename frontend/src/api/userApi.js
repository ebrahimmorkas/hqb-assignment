import apiRequest from './client';

export const getAllUsers = () => apiRequest('/users');
