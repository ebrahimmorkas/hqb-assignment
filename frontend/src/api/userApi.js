import apiRequest from './client';

export const getAllUsers = () => apiRequest('/users');

export const getUserById = (id) => apiRequest(`/users/${id}`);

export const getUserByIts = (its) => apiRequest(`/users/its/${its}`);

export const createUser = (data) => apiRequest('/users', { method: 'POST', body: data });

export const updateUser = (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: data });

export const markUserInactive = (id) => apiRequest(`/users/${id}/mark-inactive`, { method: 'PATCH' });

export const markUserActive = (id) => apiRequest(`/users/${id}/mark-active`, { method: 'PATCH' });

export const deleteUser = (id) => apiRequest(`/users/${id}`, { method: 'DELETE' });
