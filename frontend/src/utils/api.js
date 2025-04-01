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
      window.location.href = '/login'; // Redirect to login
      return { error: 'Session expired. Please log in again.' };
    }
    
    if (response.status === 204) { // No content
      return { success: true };
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
const authAPI = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || data.message || 'Login failed' };
      }
      
      // Store token and user role in localStorage
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        
        // Extract role from user object
        if (data.user && data.user.role) {
          localStorage.setItem('user_role', data.user.role);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  register: async (userData) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  forgotPassword: async (email) => {
    return fetchWithAuth('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  
  resetPassword: async (token, password) => {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  }
};

// Users API
const usersAPI = {
  getAll: async () => {
    return fetchWithAuth('/users/');
  },
  
  getById: async (userId) => {
    return fetchWithAuth(`/users/${userId}`);
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
const locationsAPI = {
  getAll: async () => {
    return fetchWithAuth('/locations/');
  },
  
  getById: async (locationId) => {
    return fetchWithAuth(`/locations/${locationId}`);
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
const checkinsAPI = {
  create: async (checkinData) => {
    return fetchWithAuth('/checkins/', {
      method: 'POST',
      body: JSON.stringify(checkinData)
    });
  },
  
  getAll: async () => {
    return fetchWithAuth('/checkins/');
  }
};

// Payroll API
const payrollAPI = {
  getData: async (startDate, endDate) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const queryString = queryParams.toString();
    return fetchWithAuth(`/payroll/${queryString ? '?' + queryString : ''}`);
  },
  
  exportToExcel: async (startDate, endDate) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const queryString = queryParams.toString();
    
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/payroll/export${queryString ? '?' + queryString : ''}`, {
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
      
      // Create a link element, set the download attribute and click it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payroll_report_${startDate || 'all'}_to_${endDate || 'present'}.xlsx`;
      
      // Append to the document and trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { error: 'Network error. Please check your connection.' };
    }
  }
};

// Dashboard API
const dashboardAPI = {
  getEmployeeData: async () => {
    return fetchWithAuth('/dashboard/employee');
  },
  
  getEarningsData: async () => {
    return fetchWithAuth('/dashboard/earnings');
  },
  
  getRecentActivity: async (limit = 10) => {
    return fetchWithAuth(`/dashboard/activity?limit=${limit}`);
  },
  
  getStatistics: async () => {
    return fetchWithAuth('/dashboard/statistics');
  }
};

// Export a unified API object
const api = {
  auth: authAPI,
  users: usersAPI,
  locations: locationsAPI,
  checkins: checkinsAPI,
  payroll: payrollAPI,
  dashboard: dashboardAPI
};

export default api;