// frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, DollarSign, Clock } from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = ({ onPageChange }) => {
  // State hooks for different data points
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recentShifts, setRecentShifts] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalLocations: 0,
    activeShifts: 0,
    pendingInvoices: 0
  });
  
  // Fetch all dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Load Admin user data
        const userDataResponse = await api.dashboard.getEmployeeData();
        
        // Load all employees
        const employeesResponse = await api.users.getAll();
        
        // Load all locations
        const locationsResponse = await api.locations.getAll();
        
        // Load recent shifts
        const shiftsResponse = await api.shifts.getAll({ limit: 5 });
        
        if (userDataResponse.error) {
          console.error("Error fetching user data:", userDataResponse.error);
        } else {
          setUserData(userDataResponse);
        }
        
        if (employeesResponse.error) {
          console.error("Error fetching employees:", employeesResponse.error);
        } else {
          // Filter only employee roles
          const employeesList = employeesResponse.filter(user => user.role === 'Employee');
          setEmployees(employeesList);
          setStats(prev => ({ ...prev, totalEmployees: employeesList.length }));
        }
        
        if (locationsResponse.error) {
          console.error("Error fetching locations:", locationsResponse.error);
        } else {
          setLocations(locationsResponse);
          setStats(prev => ({ ...prev, totalLocations: locationsResponse.length }));
        }
        
        if (shiftsResponse.error) {
          console.error("Error fetching shifts:", shiftsResponse.error);
        } else {
          setRecentShifts(shiftsResponse);
          
          // Count active/future shifts
          const now = new Date();
          const activeShifts = shiftsResponse.filter(shift => 
            new Date(shift.end_time) > now && shift.status === 'Scheduled'
          ).length;
          
          setStats(prev => ({ ...prev, activeShifts }));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Navigate to appropriate management pages
  const handleManageEmployees = () => {
    if (onPageChange) onPageChange('users');
  };
  
  const handleManageLocations = () => {
    if (onPageChange) onPageChange('locations');
  };
  
  const handleManageShifts = () => {
    if (onPageChange) onPageChange('shifts');
  };
  
  const handleManagePayroll = () => {
    if (onPageChange) onPageChange('payroll');
  };

  // Format dates in a friendly way
  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString('en-US', options);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {userData?.name || 'Admin'}!
            </h2>
            <p className="text-gray-600">Workforce Management System Admin Dashboard</p>
          </div>
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
            Administrator
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Locations</p>
                <p className="text-2xl font-bold">{stats.totalLocations}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Shifts</p>
                <p className="text-2xl font-bold">{stats.activeShifts}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Invoices</p>
                <p className="text-2xl font-bold">{stats.pendingInvoices || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-700 text-white">
          <h3 className="text-lg font-medium">Management Actions</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={handleManageEmployees} 
            className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200"
          >
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <span className="font-medium">Manage Employees</span>
          </button>
          
          <button 
            onClick={handleManageLocations} 
            className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200"
          >
            <MapPin className="h-8 w-8 text-green-600 mb-2" />
            <span className="font-medium">Manage Locations</span>
          </button>
          
          <button 
            onClick={handleManageShifts} 
            className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200"
          >
            <Calendar className="h-8 w-8 text-purple-600 mb-2" />
            <span className="font-medium">Manage Shifts</span>
          </button>
          
          <button 
            onClick={handleManagePayroll} 
            className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-200"
          >
            <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="font-medium">Generate Invoices</span>
          </button>
        </div>
      </div>
      
      {/* Recent Shifts */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-medium">Recent Shifts</h3>
          <button 
            onClick={handleManageShifts}
            className="text-sm bg-white text-purple-600 px-3 py-1 rounded hover:bg-purple-100 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentShifts && recentShifts.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{shift.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{shift.location_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(shift.start_time)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(shift.end_time)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${shift.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                          shift.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}
                      `}>
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Clock className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p>No shifts scheduled yet</p>
              <button 
                onClick={handleManageShifts}
                className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Shifts
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Employee and Location Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employees List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
            <h3 className="text-lg font-medium">Employees</h3>
            <button 
              onClick={handleManageEmployees}
              className="text-sm bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              Manage
            </button>
          </div>
          
          {employees && employees.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <li key={employee.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-medium text-blue-600">{employee.username ? employee.username.charAt(0).toUpperCase() : 'E'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{employee.username}</p>
                      <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <button 
                        onClick={() => handleManageShifts(employee.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                      >
                        Assign Shift
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p>No employees found</p>
              <button 
                onClick={handleManageEmployees}
                className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Employees
              </button>
            </div>
          )}
        </div>
        
        {/* Locations List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-green-600 text-white flex justify-between items-center">
            <h3 className="text-lg font-medium">Locations</h3>
            <button 
              onClick={handleManageLocations}
              className="text-sm bg-white text-green-600 px-3 py-1 rounded hover:bg-green-100 transition-colors"
            >
              Manage
            </button>
          </div>
          
          {locations && locations.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {locations.map((location) => (
                <li key={location.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{location.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-sm text-gray-500">
                      Radius: {location.radius} km
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p>No locations found</p>
              <button 
                onClick={handleManageLocations}
                className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Locations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;