// Updated ShiftManagement.jsx properly using enhancedApi
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, ArrowLeft, ArrowRight, Check, X, AlertCircle } from 'lucide-react';
import enhancedApi from '../utils/enhancedApi';

const ShiftManagement = ({ onDataChange }) => {
  // State hooks for shifts and related data
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for adding/editing shifts
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    locationId: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    notes: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: ''
  });

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch shifts when month or filter changes
  useEffect(() => {
    const fetchFilteredShifts = async () => {
      try {
        // Prepare filter parameters
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        // First day of month
        const startDate = filters.startDate || `${year}-${month.toString().padStart(2, '0')}-01`;
        
        // Last day of month
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = filters.endDate || `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        
        const params = {
          start_date: startDate,
          end_date: endDate
        };
        
        if (filters.employeeId) {
          params.user_id = filters.employeeId;
        }
        
        const response = await enhancedApi.shifts.getAll(params);
        setShifts(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error fetching shifts:", error);
        setError("Failed to load shifts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (employees.length > 0 && locations.length > 0) {
      fetchFilteredShifts();
    }
  }, [currentMonth, filters, employees, locations]);

  // Fetch all necessary data
  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch employees
      const employeesResponse = await enhancedApi.users.getAll();
      
      // Fetch locations
      const locationsResponse = await enhancedApi.locations.getAll();
      
      if (Array.isArray(employeesResponse)) {
        // Filter to only include employees (not admins)
        const filteredEmployees = employeesResponse.filter(user => user.role === 'Employee');
        setEmployees(filteredEmployees);
        
        // Set default employee for form if available
        if (filteredEmployees.length > 0) {
          setShiftForm(prevForm => ({
            ...prevForm,
            employeeId: filteredEmployees[0].id
          }));
        }
      } else {
        setError("Failed to load employees.");
      }
      
      if (Array.isArray(locationsResponse)) {
        setLocations(locationsResponse);
        
        // Set default location for form if available
        if (locationsResponse.length > 0) {
          setShiftForm(prevForm => ({
            ...prevForm,
            locationId: locationsResponse[0].id
          }));
        }
      } else {
        setError("Failed to load locations.");
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to load data. Please try again.");
    }
  };

  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };
  
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setShiftForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    // Filters are applied via useEffect when state changes
    setIsLoading(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      employeeId: '',
      startDate: '',
      endDate: ''
    });
    setIsLoading(true);
  };

  // Add new shift with conflict validation
  const handleAddShift = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    if (!shiftForm.employeeId || !shiftForm.locationId || !shiftForm.startDate || !shiftForm.endDate) {
      setError("Please fill in all required fields.");
      return;
    }
    
    try {
      // Format dates and times for API
      const startDateTime = `${shiftForm.startDate}T${shiftForm.startTime}:00`;
      const endDateTime = `${shiftForm.endDate}T${shiftForm.endTime}:00`;
      
      // Validate that end time is after start time
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setError("End time must be after start time.");
        return;
      }
      
      // Check for conflicts using the enhanced API
      const { hasConflicts, conflicts } = await enhancedApi.shifts.checkConflicts(
        shiftForm.employeeId,
        startDateTime,
        endDateTime
      );
      
      // If conflicts exist, show error message
      if (hasConflicts) {
        setError(`Scheduling conflict detected. This employee already has a shift during this time.`);
        return;
      }
      
      // Prepare shift data
      const shiftData = {
        user_id: parseInt(shiftForm.employeeId),
        location_id: parseInt(shiftForm.locationId),
        start_time: startDateTime,
        end_time: endDateTime,
        notes: shiftForm.notes
      };
      
      // Use enhanced API to create shift
      const response = await enhancedApi.shifts.create(shiftData);
      
      if (response && response.id) {
        setSuccess("Shift scheduled successfully!");
        
        // Reset form with same employee and location for easier multiple scheduling
        setShiftForm(prev => ({
          ...prev,
          startDate: '',
          endDate: '',
          notes: ''
        }));
        
        // Refresh shifts
        const updatedShifts = await enhancedApi.shifts.getAll();
        setShifts(Array.isArray(updatedShifts) ? updatedShifts : []);
        
        // Notify parent component of data change if callback exists
        if (onDataChange) {
          onDataChange();
        }
        
        // Close modal if user wants
        setTimeout(() => {
          if (window.confirm("Shift added successfully. Close the form?")) {
            setShowAddModal(false);
          }
        }, 500);
      } else {
        setError(response?.error || "Failed to schedule shift.");
      }
    } catch (error) {
      console.error("Error adding shift:", error);
      setError("Failed to schedule shift. Please try again.");
    }
  };

  // Delete shift
  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) {
      return;
    }
    
    try {
      const response = await enhancedApi.shifts.delete(shiftId);
      
      if (response && response.message) {
        // Remove from local state
        setShifts(shifts.filter(shift => shift.id !== shiftId));
        
        setSuccess("Shift deleted successfully!");
        
        // Notify parent component of data change if callback exists
        if (onDataChange) {
          onDataChange();
        }
      } else {
        setError(response?.error || "Failed to delete shift.");
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      setError("Failed to delete shift. Please try again.");
    }
  };

  // Format dates and times
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get employee and location names by ID
  const getEmployeeName = (id) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? employee.username : 'Unknown';
  };
  
  const getLocationName = (id) => {
    const location = locations.find(loc => loc.id === id);
    return location ? location.name : 'Unknown';
  };

  // Generate classes for shift status
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Missed':
        return 'bg-red-100 text-red-800';
      default: // Scheduled
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Prepare calendar dates
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      
      // Find shifts for this day
      const dayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.start_time);
        return shiftDate.getDate() === day && 
               shiftDate.getMonth() === month && 
               shiftDate.getFullYear() === year;
      });
      
      return { date, shifts: dayShifts };
    });
  };

  // Calendar days
  const calendarDays = getDaysInMonth();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Shift Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Schedule Shift
        </button>
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Filter Shifts</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="employeeFilter" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              id="employeeFilter"
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="">All Employees</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDateFilter" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              id="startDateFilter"
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDateFilter" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              id="endDateFilter"
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-purple-600 text-white">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-purple-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-purple-500 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {/* Blank cells for days before the 1st of the month */}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, index) => (
                <div key={`blank-${index}`} className="h-24 bg-gray-50 rounded"></div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map(({ date, shifts }) => {
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className={`h-24 border rounded p-1 ${isToday ? 'border-purple-500 shadow-sm' : 'border-gray-200'} overflow-y-auto`}
                  >
                    <div className={`text-right text-sm font-semibold ${isToday ? 'text-purple-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </div>
                    
                    {shifts.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {shifts.map(shift => (
                          <div 
                            key={shift.id} 
                            className="text-xs p-1 rounded bg-purple-100 text-purple-800 flex justify-between"
                          >
                            <span className="truncate">{getEmployeeName(shift.user_id)}</span>
                            <button 
                              onClick={() => handleDeleteShift(shift.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* List View of Shifts */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">All Scheduled Shifts</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p>No shifts scheduled for the selected period</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule a Shift
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{getEmployeeName(shift.user_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{getLocationName(shift.location_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(shift.start_time)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(shift.status)}`}>
                        {shift.status || 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddShift}>
                <div className="bg-purple-600 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-white">Schedule New Shift</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Employee Selection */}
                    <div>
                      <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                        Employee*
                      </label>
                      <select
                        id="employeeId"
                        name="employeeId"
                        value={shiftForm.employeeId}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>{employee.username}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Location Selection */}
                    <div>
                      <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                        Location*
                      </label>
                      <select
                        id="locationId"
                        name="locationId"
                        value={shiftForm.locationId}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      >
                        <option value="">Select Location</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Shift Start */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Start Date*
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          id="startDate"
                          value={shiftForm.startDate}
                          onChange={handleFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                          Start Time*
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          id="startTime"
                          value={shiftForm.startTime}
                          onChange={handleFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Shift End */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          End Date*
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          id="endDate"
                          value={shiftForm.endDate}
                          onChange={handleFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                          End Time*
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          id="endTime"
                          value={shiftForm.endTime}
                          onChange={handleFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={shiftForm.notes}
                        onChange={handleFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        placeholder="Optional notes about the shift"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500">* Required fields</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Schedule Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;