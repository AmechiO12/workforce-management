// src/utils/api.js
const API_URL = 'http://127.0.0.1:5000';

// Helper function to handle common fetch options
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Handle unauthorized responses (token expired)
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      window.location.href = '/'; // Redirect to login
      return { error: 'Session expired. Please log in again.' };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.error || data.message || 'Something went wrong',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error. Please check your connection.' };
  }
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  register: async (userData) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return fetchWithAuth('/users/');
  },
  
  create: async (userData) => {
    return fetchWithAuth('/users/', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  update: async (userId, userData) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  
  delete: async (userId) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
};

// Locations API
export const locationsAPI = {
  getAll: async () => {
    return fetchWithAuth('/locations/');
  },
  
  create: async (locationData) => {
    return fetchWithAuth('/locations/', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  },
  
  update: async (locationId, locationData) => {
    return fetchWithAuth(`/locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(locationData)
    });
  },
  
  delete: async (locationId) => {
    return fetchWithAuth(`/locations/${locationId}`, {
      method: 'DELETE'
    });
  }
};

// Check-ins API
export const checkinsAPI = {
  create: async (checkinData) => {
    return fetchWithAuth('/checkins/', {
      method: 'POST',
      body: JSON.stringify(checkinData)
    });
  },
  
  getRecent: async () => {
    return fetchWithAuth('/checkins/recent');
  }
};

// Payroll API
export const payrollAPI = {
  getData: async (startDate, endDate) => {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    }).toString();
    
    return fetchWithAuth(`/payroll/?${queryParams}`);
  },
  
  exportToExcel: async (startDate, endDate) => {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    }).toString();
    
    // For file downloads, we need to handle the response differently
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(`${API_URL}/payroll/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to export payroll data' };
      }
      
      // Return the blob for downloading
      const blob = await response.blob();
      return { blob };
    } catch (error) {
      console.error('Export failed:', error);
      return { error: 'Network error. Please check your connection.' };
    }
  }
};

export default {
  auth: authAPI,
  users: usersAPI,
  locations: locationsAPI,
  checkins: checkinsAPI,
  payroll: payrollAPI
};