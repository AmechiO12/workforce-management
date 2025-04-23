// frontend/src/utils/enhancedApi.js
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
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    
    // Return error message or data
    return Promise.reject(
      error.response ? error.response.data : { error: 'Network Error' }
    );
  }
);

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
  // Simple Haversine formula implementation
  const toRad = value => value * Math.PI / 180;
  const R = 6371; // Earth's radius in km
  
  // Handle different possible coordinate formats
  const lat1 = point1.lat || point1.latitude || 0;
  const lng1 = point1.lng || point1.longitude || 0;
  const lat2 = point2.lat || point2.latitude || 0;
  const lng2 = point2.lng || point2.longitude || 0;
  
  console.log("Calculating distance between points:", 
    { point1: { lat: lat1, lng: lng1 }, point2: { lat: lat2, lng: lng2 } });
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  console.log("Calculated distance:", distance, "km");
  return distance;
}

/**
 * Enhanced API service that improves connectivity between admin and employee components
 * This extends the base API with additional methods and error handling
 */
const enhancedApi = {
  // Authentication
  auth: {
    // Login user
    login: async (username, password) => {
      try {
        const response = await apiClient.post('/auth/login', { username, password });
        
        // Process successful login
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user_role', response.user.role);
          localStorage.setItem('user_id', response.user.id);
          localStorage.setItem('username', response.user.username);
        }
        
        return response;
      } catch (error) {
        console.error('Login error:', error);
        return { error: error.error || 'Authentication failed' };
      }
    },
    
    // Register new user
    register: async (userData) => {
      try {
        const response = await apiClient.post('/auth/register', userData);
        return response;
      } catch (error) {
        console.error('Registration error:', error);
        return { error: error.error || 'Registration failed' };
      }
    },
    
    // Send forgot password request
    forgotPassword: async (email) => {
      try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response;
      } catch (error) {
        console.error('Forgot password error:', error);
        return { error: error.error || 'Failed to process forgot password request' };
      }
    },
    
    // Reset password with token
    resetPassword: async (token, password) => {
      try {
        const response = await apiClient.post('/auth/reset-password', { token, password });
        return response;
      } catch (error) {
        console.error('Reset password error:', error);
        return { error: error.error || 'Failed to reset password' };
      }
    },
    
    // Logout user (client-side)
    logout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
  },
  
  // Users
  users: {
    // Get all users
    getAll: async () => {
      try {
        return await apiClient.get('/users/');
      } catch (error) {
        console.error('Error fetching users:', error);
        return { error: error.error || 'Failed to fetch users' };
      }
    },
    
    // Get user by ID
    getById: async (userId) => {
      try {
        return await apiClient.get(`/users/${userId}`);
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return { error: error.error || 'Failed to fetch user' };
      }
    },
    
    // Create new user
    create: async (userData) => {
      try {
        return await apiClient.post('/users/', userData);
      } catch (error) {
        console.error('Error creating user:', error);
        return { error: error.error || 'Failed to create user' };
      }
    },
    
    // Update existing user
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
    // Get all locations
    getAll: async () => {
      try {
        return await apiClient.get('/locations/');
      } catch (error) {
        console.error('Error fetching locations:', error);
        return { error: error.error || 'Failed to fetch locations' };
      }
    },
    
    // Get location by ID
    getById: async (locationId) => {
      try {
        return await apiClient.get(`/locations/${locationId}`);
      } catch (error) {
        console.error(`Error fetching location ${locationId}:`, error);
        return { error: error.error || 'Failed to fetch location' };
      }
    },
    
    // Create new location
    create: async (locationData) => {
      try {
        return await apiClient.post('/locations/', locationData);
      } catch (error) {
        console.error('Error creating location:', error);
        return { error: error.error || 'Failed to create location' };
      }
    },
    
    // Update existing location
    update: async (locationId, locationData) => {
      try {
        return await apiClient.put(`/locations/${locationId}`, locationData);
      } catch (error) {
        console.error(`Error updating location ${locationId}:`, error);
        return { error: error.error || 'Failed to update location' };
      }
    },
    
    // Delete location
    delete: async (locationId) => {
      try {
        return await apiClient.delete(`/locations/${locationId}`);
      } catch (error) {
        console.error(`Error deleting location ${locationId}:`, error);
        return { error: error.error || 'Failed to delete location' };
      }
    }
  },
  
// Updated enhancedApi.checkins methods for both check-in and check-out functionality

// This is a partial file showing just the checkins section of the enhancedApi.js utility
// Integrate this into your existing enhancedApi.js file

// Check-ins
checkins: {
  // Create new check-in or check-out
  create: async (checkData) => {
    try {
      return await apiClient.post('/checkins/', checkData);
    } catch (error) {
      console.error('Error creating check-in/out:', error);
      return { error: error.error || 'Failed to process check-in/out' };
    }
  },
  
  // Enhanced check-in/out with location validation
  createWithValidation: async (checkData) => {
    try {
      // Validate required fields
      if (!checkData.location_id || !checkData.latitude || !checkData.longitude) {
        return { error: 'Missing required fields' };
      }
      
      // If check_type not specified, default to check-in
      if (!checkData.check_type) {
        checkData.check_type = 'in';
      }
      
      // Ensure check_type is valid
      if (checkData.check_type !== 'in' && checkData.check_type !== 'out') {
        return { error: 'Invalid check type. Must be "in" or "out"' };
      }
      
      // Get location details to verify distance
      const location = await enhancedApi.locations.getById(checkData.location_id);
      
      if (!location || location.error) {
        return { error: 'Invalid location' };
      }
      
      // Calculate distance
      const distance = calculateDistance(
        { lat: checkData.latitude, lng: checkData.longitude },
        { lat: location.latitude, lng: location.longitude }
      );
      
      // Check if within radius
      if (distance > location.radius) {
        return {
          success: false,
          error: `You are too far from the ${checkData.check_type === 'in' ? 'check-in' : 'check-out'} location (${distance.toFixed(2)} km)`,
          distance_km: distance
        };
      }
      
      // Proceed with check-in/out
      const response = await apiClient.post('/checkins/', checkData);
      
      // Update recent activity in the background
      try {
        // No need to await this, just refresh in the background
        enhancedApi.dashboard.getRecentActivity(5);
      } catch (e) {
        // Ignore errors during background refresh
      }
      
      return {
        ...response,
        success: true,
        check_type: checkData.check_type,
        distance_km: distance
      };
    } catch (error) {
      console.error('Error during check-in/out validation:', error);
      return { 
        success: false,
        error: error.error || 'Failed to validate check-in/out' 
      };
    }
  },
  
  // Get recent check-ins/outs
  getRecent: async (limit = 10) => {
    try {
      return await apiClient.get(`/checkins/?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      return { error: error.error || 'Failed to fetch check-ins' };
    }
  },
  
  // Get user's current check status (in/out)
  getCurrentStatus: async () => {
    try {
      // Get recent activity to determine current status
      const activity = await enhancedApi.dashboard.getRecentActivity(5);
      
      if (!Array.isArray(activity) || activity.length === 0) {
        return { status: 'out', lastActivity: null };
      }
      
      // Find most recent check-in or check-out
      const checkActivity = activity.find(item => 
        item.type === 'check-in' || item.type === 'check-out'
      );
      
      if (!checkActivity) {
        return { status: 'out', lastActivity: null };
      }
      
      // Return status based on most recent activity
      return {
        status: checkActivity.type === 'check-in' ? 'in' : 'out',
        lastActivity: checkActivity
      };
    } catch (error) {
      console.error('Error fetching check status:', error);
      // Default to out if there's an error
      return { status: 'out', error: error.error || 'Failed to get current status' };
    }
  }
},
  
  // Shifts
  shifts: {
    // Get all shifts with optional filters
    getAll: async (params = {}) => {
      try {
        return await apiClient.get('/shifts/', { params });
      } catch (error) {
        console.error('Error fetching shifts:', error);
        return { error: error.error || 'Failed to fetch shifts' };
      }
    },
    
    // Get shift by ID
    getById: async (shiftId) => {
      try {
        return await apiClient.get(`/shifts/${shiftId}`);
      } catch (error) {
        console.error(`Error fetching shift ${shiftId}:`, error);
        return { error: error.error || 'Failed to fetch shift' };
      }
    },
    
    // Create new shift
    create: async (shiftData) => {
      try {
        return await apiClient.post('/shifts/', shiftData);
      } catch (error) {
        console.error('Error creating shift:', error);
        return { error: error.error || 'Failed to create shift' };
      }
    },
    
    // Create shift with conflict validation
    createWithValidation: async (shiftData) => {
      try {
        // Check for conflicts first
        const { hasConflicts, conflicts } = await enhancedApi.shifts.checkConflicts(
          shiftData.user_id,
          shiftData.start_time,
          shiftData.end_time
        );
        
        if (hasConflicts) {
          return {
            error: 'Shift conflicts with existing schedule',
            conflicts
          };
        }
        
        // If no conflicts, create the shift
        return await enhancedApi.shifts.create(shiftData);
      } catch (error) {
        console.error('Error creating shift with validation:', error);
        return { error: error.error || 'Failed to create shift' };
      }
    },
    
    // Check for scheduling conflicts
    checkConflicts: async (employeeId, startTime, endTime) => {
      try {
        // Get employee's shifts
        const params = { user_id: employeeId };
        const shifts = await enhancedApi.shifts.getAll(params);
        
        if (!Array.isArray(shifts)) {
          return { hasConflicts: false, conflicts: [] };
        }
        
        // Parse dates for comparison
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        // Check for overlaps
        const conflicts = shifts.filter(shift => {
          const shiftStart = new Date(shift.start_time);
          const shiftEnd = new Date(shift.end_time);
          
          return (
            (start >= shiftStart && start < shiftEnd) || // Start during existing shift
            (end > shiftStart && end <= shiftEnd) || // End during existing shift
            (start <= shiftStart && end >= shiftEnd) // Contains existing shift
          );
        });
        
        return {
          hasConflicts: conflicts.length > 0,
          conflicts
        };
      } catch (error) {
        console.error('Error checking for conflicts:', error);
        return { error: error.error || 'Failed to check for conflicts' };
      }
    },
    
    // Update existing shift
    update: async (shiftId, shiftData) => {
      try {
        return await apiClient.put(`/shifts/${shiftId}`, shiftData);
      } catch (error) {
        console.error(`Error updating shift ${shiftId}:`, error);
        return { error: error.error || 'Failed to update shift' };
      }
    },
    
    // Delete shift
    delete: async (shiftId) => {
      try {
        return await apiClient.delete(`/shifts/${shiftId}`);
      } catch (error) {
        console.error(`Error deleting shift ${shiftId}:`, error);
        return { error: error.error || 'Failed to delete shift' };
      }
    }
  },
  
  // Dashboard - Matching your existing API structure
  dashboard: {
    // Get employee data
    getEmployeeData: async () => {
      try {
        return await apiClient.get('/dashboard/employee');
      } catch (error) {
        console.error('Error fetching employee data:', error);
        return { error: error.error || 'Failed to fetch employee data' };
      }
    },
    
    // Get earnings data
    getEarningsData: async () => {
      try {
        return await apiClient.get('/dashboard/earnings');
      } catch (error) {
        console.error('Error fetching earnings data:', error);
        return { error: error.error || 'Failed to fetch earnings data' };
      }
    },
    
// Add this improved method to your enhancedApi.dashboard object in enhancedApi.js

// Get recent activity with cache-busting option
getRecentActivity: async (limit = 10, forceRefresh = false) => {
  try {
    // Add a cache-busting parameter when forceRefresh is true
    const url = forceRefresh 
      ? `/dashboard/activity/recent?limit=${limit}&_t=${new Date().getTime()}` 
      : `/dashboard/activity/recent?limit=${limit}`;
    
    console.log(`Fetching recent activity with ${forceRefresh ? 'forced refresh' : 'standard request'}`);
    
    // Add no-cache headers if forcing refresh
    const config = forceRefresh ? {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    } : {};
    
    const response = await apiClient.get(url, config);
    
    if (Array.isArray(response)) {
      console.log(`Retrieved ${response.length} activity items`);
      
      // Check if check-out activity exists in the response
      const hasCheckOut = response.some(item => item.type === 'check-out');
      console.log(`Activity contains check-out: ${hasCheckOut}`);
      
      if (forceRefresh) {
        // Store in localStorage to have a reference of latest data
        localStorage.setItem('recent_activity_data', JSON.stringify(response));
        localStorage.setItem('recent_activity_timestamp', new Date().getTime().toString());
      }
      
      return response;
    } else {
      console.warn('Activity response is not an array:', response);
      
      // If we got an error response but have cached data and not forcing refresh, return cached data
      if (!forceRefresh) {
        const cachedData = localStorage.getItem('recent_activity_data');
        if (cachedData) {
          console.log('Returning cached activity data');
          return JSON.parse(cachedData);
        }
      }
      
      return { error: response.error || 'Invalid activity data format' };
    }
  } catch (error) {
    console.error('Error fetching activity data:', error);
    
    // If we have cached data and not forcing refresh, return cached data on error
    if (!forceRefresh) {
      const cachedData = localStorage.getItem('recent_activity_data');
      if (cachedData) {
        console.log('Returning cached activity data after error');
        return JSON.parse(cachedData);
      }
    }
    
    return { error: error.error || 'Failed to fetch activity data' };
  }
},
    
    // Get schedule data
    getScheduleData: async (year, month) => {
      try {
        return await apiClient.get(`/dashboard/schedule/${year}/${month}`);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        return { error: error.error || 'Failed to fetch schedule data' };
      }
    },
    
    // New unified method that works with your existing data structure
    getUnifiedDashboardData: async () => {
      try {
        const userData = await enhancedApi.dashboard.getEmployeeData();
        const activityData = await enhancedApi.dashboard.getRecentActivity();
        
        // Get appropriate role-specific data
        const userRole = localStorage.getItem('user_role');
        let roleSpecificData = {};
        
        if (userRole === 'Admin') {
          // For admin, get all employees and locations
          const [employees, locations, shifts] = await Promise.all([
            enhancedApi.users.getAll(),
            enhancedApi.locations.getAll(),
            enhancedApi.shifts.getAll()
          ]);
          
          roleSpecificData = {
            employees: Array.isArray(employees) ? employees : [],
            locations: Array.isArray(locations) ? locations : [],
            shifts: Array.isArray(shifts) ? shifts : []
          };
        } else {
          // For employee, get earnings and schedule
          const today = new Date();
          const [earningsData, scheduleData] = await Promise.all([
            enhancedApi.dashboard.getEarningsData(),
            enhancedApi.dashboard.getScheduleData(today.getFullYear(), today.getMonth() + 1)
          ]);
          
          roleSpecificData = {
            earnings: earningsData,
            schedule: Array.isArray(scheduleData) ? scheduleData : []
          };
        }
        
        return {
          userData,
          activityData: Array.isArray(activityData) ? activityData : [],
          ...roleSpecificData
        };
      } catch (error) {
        console.error('Error fetching unified dashboard data:', error);
        return { error: error.error || 'Failed to fetch dashboard data' };
      }
    }
  },
  
  // Payroll
  payroll: {
    // Generate payroll report
    generate: async (params = {}) => {
      try {
        return await apiClient.get('/payroll/', { params });
      } catch (error) {
        console.error('Error generating payroll:', error);
        return { error: error.error || 'Failed to generate payroll' };
      }
    },
    
    // Export payroll to Excel
    export: async (params = {}) => {
      try {
        const response = await apiClient.get('/payroll/export', {
          params,
          responseType: 'blob'
        });
        
        return response;
      } catch (error) {
        console.error('Error exporting payroll:', error);
        return { error: error.error || 'Failed to export payroll' };
      }
    }
  }
};

export default enhancedApi;