// frontend/src/utils/api.js
import axios from 'axios';

// Base API URL
const BASE_URL = 'http://127.0.0.1:5000';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // Handle unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
    
    // Return error message or data
    return Promise.reject(
      error.response ? error.response.data : { error: 'Network Error' }
    );
  }
);

// API service object
const api = {
  // Authentication
  auth: {
    login: async (username, password) => {
      try {
        const response = await apiClient.post('/auth/login', { username, password });
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user_role', response.user.role);
        }
        return response;
      } catch (error) {
        console.error('Login error:', error);
        return error;
      }
    },
    
    register: async (userData) => {
      try {
        return await apiClient.post('/auth/register', userData);
      } catch (error) {
        console.error('Registration error:', error);
        return error;
      }
    },
    
    forgotPassword: async (email) => {
      try {
        return await apiClient.post('/auth/forgot-password', { email });
      } catch (error) {
        console.error('Forgot password error:', error);
        return error;
      }
    },
    
    resetPassword: async (token, password) => {
      try {
        return await apiClient.post('/auth/reset-password', { token, password });
      } catch (error) {
        console.error('Reset password error:', error);
        return error;
      }
    },
    
    logout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
  },
  
  // Users
  users: {
    getAll: async () => {
      try {
        return await apiClient.get('/users/');
      } catch (error) {
        console.error('Error fetching users:', error);
        return { error: error.error || 'Failed to fetch users' };
      }
    },
    
    getById: async (userId) => {
      try {
        return await apiClient.get(`/users/${userId}`);
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return { error: error.error || 'Failed to fetch user' };
      }
    },
    
    create: async (userData) => {
      try {
        return await apiClient.post('/users/', userData);
      } catch (error) {
        console.error('Error creating user:', error);
        return { error: error.error || 'Failed to create user' };
      }
    },
    
    update: async (userId, userData) => {
      try {
        return await apiClient.put(`/users/${userId}`, userData);
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return { error: error.error || 'Failed to update user' };
      }
    }
  },
  
  // Locations
  locations: {
    getAll: async () => {
      try {
        return await apiClient.get('/locations/');
      } catch (error) {
        console.error('Error fetching locations:', error);
        return { error: error.error || 'Failed to fetch locations' };
      }
    },
    
    getById: async (locationId) => {
      try {
        return await apiClient.get(`/locations/${locationId}`);
      } catch (error) {
        console.error(`Error fetching location ${locationId}:`, error);
        return { error: error.error || 'Failed to fetch location' };
      }
    },
    
    create: async (locationData) => {
      try {
        return await apiClient.post('/locations/', locationData);
      } catch (error) {
        console.error('Error creating location:', error);
        return { error: error.error || 'Failed to create location' };
      }
    },
    
    update: async (locationId, locationData) => {
      try {
        return await apiClient.put(`/locations/${locationId}`, locationData);
      } catch (error) {
        console.error(`Error updating location ${locationId}:`, error);
        return { error: error.error || 'Failed to update location' };
      }
    },
    
    delete: async (locationId) => {
      try {
        return await apiClient.delete(`/locations/${locationId}`);
      } catch (error) {
        console.error(`Error deleting location ${locationId}:`, error);
        return { error: error.error || 'Failed to delete location' };
      }
    }
  },
  
  // Check-ins
  checkins: {
    create: async (checkInData) => {
      try {
        return await apiClient.post('/checkins/', checkInData);
      } catch (error) {
        console.error('Error creating check-in:', error);
        return { error: error.error || 'Failed to check in' };
      }
    },
    
    getRecent: async (limit = 10) => {
      try {
        return await apiClient.get(`/checkins/?limit=${limit}`);
      } catch (error) {
        console.error('Error fetching check-ins:', error);
        return { error: error.error || 'Failed to fetch check-ins' };
      }
    }
  },
  
  // Shifts
  shifts: {
    getAll: async (params = {}) => {
      try {
        return await apiClient.get('/shifts/', { params });
      } catch (error) {
        console.error('Error fetching shifts:', error);
        return { error: error.error || 'Failed to fetch shifts' };
      }
    },
    
    getById: async (shiftId) => {
      try {
        return await apiClient.get(`/shifts/${shiftId}`);
      } catch (error) {
        console.error(`Error fetching shift ${shiftId}:`, error);
        return { error: error.error || 'Failed to fetch shift' };
      }
    },
    
    create: async (shiftData) => {
      try {
        return await apiClient.post('/shifts/', shiftData);
      } catch (error) {
        console.error('Error creating shift:', error);
        return { error: error.error || 'Failed to create shift' };
      }
    },
    
    update: async (shiftId, shiftData) => {
      try {
        return await apiClient.put(`/shifts/${shiftId}`, shiftData);
      } catch (error) {
        console.error(`Error updating shift ${shiftId}:`, error);
        return { error: error.error || 'Failed to update shift' };
      }
    },
    
    delete: async (shiftId) => {
      try {
        return await apiClient.delete(`/shifts/${shiftId}`);
      } catch (error) {
        console.error(`Error deleting shift ${shiftId}:`, error);
        return { error: error.error || 'Failed to delete shift' };
      }
    }
  },
  
  // Dashboard
  dashboard: {
    getEmployeeData: async () => {
      try {
        return await apiClient.get('/dashboard/employee');
      } catch (error) {
        console.error('Error fetching employee data:', error);
        return { error: error.error || 'Failed to fetch employee data' };
      }
    },
    
    getEarningsData: async () => {
      try {
        return await apiClient.get('/dashboard/earnings');
      } catch (error) {
        console.error('Error fetching earnings data:', error);
        return { error: error.error || 'Failed to fetch earnings data' };
      }
    },
    
    getRecentActivity: async (limit = 10) => {
      try {
        return await apiClient.get(`/dashboard/activity/recent?limit=${limit}`);
      } catch (error) {
        console.error('Error fetching activity data:', error);
        return { error: error.error || 'Failed to fetch activity data' };
      }
    },
    
    getScheduleData: async (year, month) => {
      try {
        return await apiClient.get(`/dashboard/schedule/${year}/${month}`);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        return { error: error.error || 'Failed to fetch schedule data' };
      }
    }
  },
  
  // Payroll
  payroll: {
    generate: async (params = {}) => {
      try {
        return await apiClient.get('/payroll/', { params });
      } catch (error) {
        console.error('Error generating payroll:', error);
        return { error: error.error || 'Failed to generate payroll' };
      }
    },
    
    export: async (params = {}) => {
      try {
        return await apiClient.get('/payroll/export', {
          params,
          responseType: 'blob'
        });
      } catch (error) {
        console.error('Error exporting payroll:', error);
        return { error: error.error || 'Failed to export payroll' };
      }
    }
  }
};

export default api;