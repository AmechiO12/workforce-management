// src/utils/api.js
const API_URL = 'http://127.0.0.1:5000';

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
};

export const register = async (username, email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return response.json();
};

export const getLocations = async (token) => {
  const response = await fetch(`${API_URL}/locations/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Add more API functions for other endpoints