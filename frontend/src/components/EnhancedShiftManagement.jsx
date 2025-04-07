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

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch shifts when month or filter changes
  useEffect(() => {
    // Existing shift fetching logic
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
          
          // Create the shift
          const response = await api.shifts.create(shiftData);
          
          if (response && response.id) {
            successCount++;
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

  // Add the batch scheduling modal to the component JSX
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

  // Add batch schedule button next to the regular schedule button in the component JSX
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

  // Update the return statement to include the new modal and action buttons
  // Instead of just:
  // <button onClick={() => setShowAddModal(true)}>...</button>
  // render:
  // {renderActionButtons()}
  // ...
  // {renderBatchSchedulingModal()}
}

export default ShiftManagement;