import apiRequest from './client';

export const getAllUsers = () => apiRequest('/users');

export const updateUser = (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: data });

export const markUserInactive = (id) => apiRequest(`/users/${id}/mark-inactive`, { method: 'PATCH' });

export const markUserActive = (id) => apiRequest(`/users/${id}/mark-active`, { method: 'PATCH' });

export const deleteUser = (id) => apiRequest(`/users/${id}`, { method: 'DELETE' });
