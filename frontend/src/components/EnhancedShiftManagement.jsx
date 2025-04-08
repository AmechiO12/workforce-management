// Enhanced ShiftManagement.jsx with batch scheduling and conflict detection

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, ArrowLeft, ArrowRight, Check, X, AlertCircle, Repeat } from 'lucide-react';
import api from '../utils/api';

const ShiftManagement = () => {
  // Existing state hooks
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
  
  // Batch scheduling state
  const [batchForm, setBatchForm] = useState({
    employeeIds: [],
    locationId: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    repeat: 'daily', // daily, weekly, custom
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday (0 is Sunday)
    notes: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: ''
  });

  // Function to fetch initial data
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch employees
      const employeeData = await api.users.getAll();
      setEmployees(employeeData || []);
      
      // Fetch locations
      const locationData = await api.locations.getAll();
      setLocations(locationData || []);
      
      // Fetch shifts
      const shiftData = await api.shifts.getAll();
      setShifts(shiftData || []);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to load data. Please try again.");
      setIsLoading(false);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch shifts when month or filter changes
  useEffect(() => {
    const fetchShifts = async () => {
      setIsLoading(true);
      try {
        // Calculate start and end of the displayed month
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Format dates for API
        const startFormatted = monthStart.toISOString().split('T')[0];
        const endFormatted = monthEnd.toISOString().split('T')[0];
        
        // Fetch all shifts since the API doesn't support filtering
        const allShifts = await api.shifts.getAll();
        
        if (!allShifts) {
          setShifts([]);
          setIsLoading(false);
          return;
        }
        
        // Filter shifts client-side
        let filteredShifts = allShifts.filter(shift => {
          const shiftDate = new Date(shift.start_time);
          return shiftDate >= monthStart && shiftDate <= monthEnd;
        });
        
        // Apply employee filter if selected
        if (filters.employeeId) {
          filteredShifts = filteredShifts.filter(shift => 
            shift.user_id === parseInt(filters.employeeId)
          );
        }
        
        // Apply date filters if selected
        if (filters.startDate) {
          const filterStartDate = new Date(filters.startDate);
          filteredShifts = filteredShifts.filter(shift => 
            new Date(shift.start_time) >= filterStartDate
          );
        }
        
        if (filters.endDate) {
          const filterEndDate = new Date(filters.endDate);
          filterEndDate.setHours(23, 59, 59); // End of the day
          filteredShifts = filteredShifts.filter(shift => 
            new Date(shift.start_time) <= filterEndDate
          );
        }
        
        setShifts(filteredShifts);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching shifts:", error);
        setError("Failed to load shifts. Please try again.");
        setIsLoading(false);
      }
    };
    
    fetchShifts();
  }, [currentMonth, filters, employees, locations]);

  // Check for scheduling conflicts
  const checkForConflicts = (employeeId, startDateTime, endDateTime) => {
    // Filter shifts for the employee
    const employeeShifts = shifts.filter(shift => shift.user_id === parseInt(employeeId));
    
    // Convert to Date objects for comparison
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // Check for overlaps
    for (const shift of employeeShifts) {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      
      // Check if there's an overlap
      if ((start >= shiftStart && start < shiftEnd) || 
          (end > shiftStart && end <= shiftEnd) ||
          (start <= shiftStart && end >= shiftEnd)) {
        return {
          hasConflict: true,
          conflictShift: shift
        };
      }
    }
    
    return { hasConflict: false };
  };

  // Batch scheduling logic
  const handleBatchSchedule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    if (!batchForm.employeeIds.length || !batchForm.locationId || !batchForm.startDate || !batchForm.endDate) {
      setError("Please fill in all required fields.");
      return;
    }
    
    try {
      // Calculate all dates in the range based on repeat pattern
      const startDate = new Date(batchForm.startDate);
      const endDate = new Date(batchForm.endDate);
      const scheduleDates = [];
      
      // Generate dates based on repeat pattern
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // For weekly pattern, check if day is selected
        if (batchForm.repeat === 'daily' || 
            (batchForm.repeat === 'weekly' && batchForm.daysOfWeek.includes(currentDate.getDay()))) {
          scheduleDates.push(new Date(currentDate));
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Track successful and failed shift creations
      let successCount = 0;
      let conflictCount = 0;
      
      // Create shifts for each employee and date
      for (const employeeId of batchForm.employeeIds) {
        for (const date of scheduleDates) {
          // Format date
          const dateString = date.toISOString().split('T')[0];
          
          // Format start and end times
          const startDateTime = `${dateString}T${batchForm.startTime}:00`;
          const endDateTime = `${dateString}T${batchForm.endTime}:00`;
          
          // Check for conflicts
          const { hasConflict } = checkForConflicts(employeeId, startDateTime, endDateTime);
          
          if (hasConflict) {
            conflictCount++;
            continue;
          }
          
          // Create shift data
          const shiftData = {
            user_id: parseInt(employeeId),
            location_id: parseInt(batchForm.locationId),
            start_time: startDateTime,
            end_time: endDateTime,
            notes: batchForm.notes
          };
          
          try {
            // Create the shift
            const response = await api.shifts.create(shiftData);
            
            if (response && response.id) {
              successCount++;
            }
          } catch (shiftError) {
            console.error("Error creating individual shift:", shiftError);
            // Continue with the next shift
          }
        }
      }
      
      // Refresh shifts
      const updatedShifts = await api.shifts.getAll();
      setShifts(updatedShifts || []);
      
      // Show success/conflict message
      if (successCount > 0) {
        setSuccess(`Successfully scheduled ${successCount} shifts.${conflictCount > 0 ? ` (${conflictCount} conflicts skipped)` : ''}`);
        setShowBatchModal(false);
      } else if (conflictCount > 0) {
        setError(`Could not schedule any shifts due to ${conflictCount} conflicts.`);
      } else {
        setError("Failed to schedule shifts. Please try again.");
      }
      
    } catch (error) {
      console.error("Error batch scheduling shifts:", error);
      setError("Failed to schedule shifts. Please try again.");
    }
  };

  // Batch form change handler
  const handleBatchFormChange = (e) => {
    const { name, value } = e.target;
    setBatchForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle employee multi-select
  const handleEmployeeSelection = (employeeId) => {
    setBatchForm(prev => {
      const employeeIds = [...prev.employeeIds];
      
      if (employeeIds.includes(employeeId)) {
        // Remove employee if already selected
        return { ...prev, employeeIds: employeeIds.filter(id => id !== employeeId) };
      } else {
        // Add employee if not already selected
        return { ...prev, employeeIds: [...employeeIds, employeeId] };
      }
    });
  };

  // Days of week toggle for weekly repeat pattern
  const toggleDayOfWeek = (day) => {
    setBatchForm(prev => {
      const daysOfWeek = [...prev.daysOfWeek];
      
      if (daysOfWeek.includes(day)) {
        // Remove day if already selected
        return { ...prev, daysOfWeek: daysOfWeek.filter(d => d !== day) };
      } else {
        // Add day if not already selected
        return { ...prev, daysOfWeek: [...daysOfWeek, day].sort() };
      }
    });
  };

  // Add shift form handler
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
      // Format start and end times
      const startDateTime = `${shiftForm.startDate}T${shiftForm.startTime}:00`;
      const endDateTime = `${shiftForm.endDate}T${shiftForm.endTime}:00`;
      
      // Check for conflicts
      const { hasConflict, conflictShift } = checkForConflicts(
        shiftForm.employeeId,
        startDateTime,
        endDateTime
      );
      
      if (hasConflict) {
        const conflictStart = new Date(conflictShift.start_time);
        const conflictEnd = new Date(conflictShift.end_time);
        
        setError(`Scheduling conflict detected with existing shift (${
          conflictStart.toLocaleString()
        } - ${
          conflictEnd.toLocaleString()
        }).`);
        return;
      }
      
      // Create shift data
      const shiftData = {
        user_id: parseInt(shiftForm.employeeId),
        location_id: parseInt(shiftForm.locationId),
        start_time: startDateTime,
        end_time: endDateTime,
        notes: shiftForm.notes
      };
      
      // Create the shift
      const response = await api.shifts.create(shiftData);
      
      if (response && response.id) {
        setSuccess("Shift scheduled successfully.");
        setShowAddModal(false);
        
        // Refresh shifts
        const updatedShifts = await api.shifts.getAll();
        setShifts(updatedShifts || []);
        
        // Reset form
        setShiftForm({
          employeeId: '',
          locationId: '',
          startDate: '',
          startTime: '09:00',
          endDate: '',
          endTime: '17:00',
          notes: ''
        });
      } else {
        setError("Failed to schedule shift. Please try again.");
      }
    } catch (error) {
      console.error("Error scheduling shift:", error);
      setError("Failed to schedule shift. Please try again.");
    }
  };

  // Handle shift form changes
  const handleShiftFormChange = (e) => {
    const { name, value } = e.target;
    setShiftForm(prev => ({ ...prev, [name]: value }));
  };

  // Change current month view
  const changeMonth = (amount) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Add the batch scheduling modal
  const renderBatchSchedulingModal = () => {
    if (!showBatchModal) return null;
    
    return (
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form onSubmit={handleBatchSchedule}>
              <div className="bg-purple-600 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-white">Batch Schedule Shifts</h3>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="space-y-4">
                  {/* Employee Selection Checklist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Employees*
                    </label>
                    <div className="mt-1 max-h-60 overflow-y-auto border rounded-md divide-y">
                      {employees.map(employee => (
                        <div key={employee.id} className="flex items-center p-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`employee-${employee.id}`}
                            checked={batchForm.employeeIds.includes(employee.id)}
                            onChange={() => handleEmployeeSelection(employee.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`employee-${employee.id}`} className="ml-3">
                            {employee.username}
                          </label>
                        </div>
                      ))}
                    </div>
                    {batchForm.employeeIds.length === 0 && (
                      <p className="mt-1 text-sm text-red-600">Please select at least one employee</p>
                    )}
                  </div>
                  
                  {/* Location Selection */}
                  <div>
                    <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                      Location*
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={batchForm.locationId}
                      onChange={handleBatchFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Start Date*
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={batchForm.startDate}
                        onChange={handleBatchFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date*
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={batchForm.endDate}
                        onChange={handleBatchFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Shift Times */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time*
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        id="startTime"
                        value={batchForm.startTime}
                        onChange={handleBatchFormChange}
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
                        value={batchForm.endTime}
                        onChange={handleBatchFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Repeat Pattern */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Repeat Pattern
                    </label>
                    <div className="mt-1 flex space-x-4">
                      <div className="flex items-center">
                        <input
                          id="daily"
                          name="repeat"
                          type="radio"
                          value="daily"
                          checked={batchForm.repeat === 'daily'}
                          onChange={handleBatchFormChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <label htmlFor="daily" className="ml-2 text-sm text-gray-700">
                          Daily
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="weekly"
                          name="repeat"
                          type="radio"
                          value="weekly"
                          checked={batchForm.repeat === 'weekly'}
                          onChange={handleBatchFormChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <label htmlFor="weekly" className="ml-2 text-sm text-gray-700">
                          Weekly
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Days of Week (for weekly pattern) */}
                  {batchForm.repeat === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDayOfWeek(index)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              batchForm.daysOfWeek.includes(index)
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      value={batchForm.notes}
                      onChange={handleBatchFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      placeholder="Optional notes about the shifts"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Schedule Shifts
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Add shift modal
  const renderAddShiftModal = () => {
    if (!showAddModal) return null;
    
    return (
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form onSubmit={handleAddShift}>
              <div className="bg-purple-600 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-white">Schedule Shift</h3>
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
                      onChange={handleShiftFormChange}
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
                      onChange={handleShiftFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Date Range */}
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
                        onChange={handleShiftFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date*
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={shiftForm.endDate}
                        onChange={handleShiftFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Shift Times */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time*
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        id="startTime"
                        value={shiftForm.startTime}
                        onChange={handleShiftFormChange}
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
                        onChange={handleShiftFormChange}
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
                      rows={2}
                      value={shiftForm.notes}
                      onChange={handleShiftFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      placeholder="Optional notes about the shift"
                    />
                  </div>
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
    );
  };

  // Add action buttons
  const renderActionButtons = () => {
    return (
      <div className="flex space-x-3">
        <button
          onClick={() => setShowBatchModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Repeat className="h-5 w-5 mr-2" />
          Batch Schedule
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Schedule Shift
        </button>
      </div>
    );
  };

  // Render shifts calendar
  const renderCalendar = () => {
    // Get the days in the current month
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();
    
    // Calculate days to show from previous month to fill the calendar
    const daysFromPrevMonth = firstDayOfMonth;
    
    // Group shifts by date
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time).toISOString().split('T')[0];
      if (!shiftsByDate[shiftDate]) {
        shiftsByDate[shiftDate] = [];
      }
      shiftsByDate[shiftDate].push(shift);
    });
    
    // Generate calendar days
    const calendarDays = [];
    
    // Add days from previous month
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const daysInPrevMonth = new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
      0
    ).getDate();
    
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i)
      });
    }
    
    // Add days for current month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
      });
    }
    
    // Add days for next month to complete the grid
    const totalDaysShown = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;
    const daysFromNextMonth = totalDaysShown - (daysFromPrevMonth + daysInMonth);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    for (let i = 1; i <= daysFromNextMonth; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i)
      });
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-full hover:bg-purple-500 focus:outline-none"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-full hover:bg-purple-500 focus:outline-none"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-white p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendarDays.map((day, index) => {
            const dateString = day.date.toISOString().split('T')[0];
            const dayShifts = shiftsByDate[dateString] || [];
            
            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-32 ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                <div className="font-medium mb-1">{day.day}</div>
                
                {/* Shifts for this day */}
                <div className="space-y-1">
                  {dayShifts.slice(0, 3).map(shift => {
                    const employee = employees.find(e => e.id === shift.user_id);
                    const location = locations.find(l => l.id === shift.location_id);
                    
                    return (
                      <div
                        key={shift.id}
                        className="bg-purple-100 p-1 rounded text-xs text-purple-800 truncate"
                        title={`${employee?.username || 'Unknown'} - ${location?.name || 'Unknown'}`}
                      >
                        {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {employee?.username || 'Unknown'}
                      </div>
                    );
                  })}
                  
                  {/* Show count if more than 3 shifts */}
                  {dayShifts.length > 3 && (
                    <div className="text-xs text-purple-600 font-medium">
                      +{dayShifts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render filters
  const renderFilters = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterEmployee" className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              id="filterEmployee"
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="">All Employees</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.username}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="filterStartDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="filterEndDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  // Display notifications
  const renderNotifications = () => {
    return (
      <>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
        {renderActionButtons()}
      </div>
      
      {renderNotifications()}
      {renderFilters()}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        renderCalendar()
      )}
      
      {renderAddShiftModal()}
      {renderBatchSchedulingModal()}
    </div>
  );
};

export default ShiftManagement;