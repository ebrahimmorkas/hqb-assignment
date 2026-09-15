import apiRequest from './client';

export const login = (its, password) =>
  apiRequest('/auth/login', { method: 'POST', body: { its, password } });

export const logout = () => apiRequest('/auth/logout', { method: 'POST' });

export const getMe = () => apiRequest('/auth/me');
