import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, DollarSign, TrendingUp, User } from 'lucide-react';
import api from '../utils/api';

// Enhanced Dashboard component for employees
const EmployeeDashboard = ({ onPageChange }) => {
  // State hooks for different data points
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch all employee data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Make real API calls
        const userDataResponse = await api.dashboard.getEmployeeData();
        const earningsResponse = await api.dashboard.getEarningsData();
        const activityResponse = await api.dashboard.getRecentActivity();
        
        const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const scheduleResponse = await api.dashboard.getScheduleData(
          currentMonth.getFullYear(), 
          currentMonth.getMonth() + 1
        );
        
        if (userDataResponse.error) {
          console.error("Error fetching user data:", userDataResponse.error);
        } else {
          setUserData(userDataResponse);
        }
        
        if (earningsResponse.error) {
          console.error("Error fetching earnings data:", earningsResponse.error);
        } else {
          setEarningsData(earningsResponse);
        }
        
        if (activityResponse.error) {
          console.error("Error fetching activity data:", activityResponse.error);
        } else {
          setActivityData(activityResponse);
        }
        
        if (scheduleResponse.error) {
          console.error("Error fetching schedule data:", scheduleResponse.error);
        } else {
          setScheduleData(scheduleResponse);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentMonth]);
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Format dates in a friendly way
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format time in a friendly way
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Calculate time ago for activity feed
  const timeAgo = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? 'Yesterday' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval > 1 ? 's' : ''} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval > 1 ? 's' : ''} ago`;
    }
    
    return 'Just now';
  };
  
  // Get days in month for calendar
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get day of week for first day of month
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar cells for current month
  const generateCalendarCells = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const cells = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }
    
    // Add cells for each day in month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const scheduleItem = scheduleData.find(item => item.date.startsWith(dateString));
      
      cells.push(
        <div key={`day-${day}`} className="h-24 border border-gray-200 overflow-hidden">
          <div className={`p-1 ${date.toDateString() === new Date().toDateString() ? 'bg-blue-100' : ''}`}>
            <span className="text-sm font-medium">{day}</span>
          </div>
          {scheduleItem && (
            <div className={`text-xs p-1 ${scheduleItem.shift === 'Off' ? 'bg-gray-100' : 'bg-green-100'}`}>
              <div className="font-medium">{scheduleItem.shift}</div>
              {scheduleItem.location && <div className="truncate">{scheduleItem.location}</div>}
            </div>
          )}
        </div>
      );
    }
    
    return cells;
  };
  
  // Handle check-in button click
  const handleCheckIn = () => {
    if (onPageChange) {
      onPageChange('checkin');
    }
  };

  // Previous month handler
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  
  // Next month handler
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };
  
  // Display loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}!</h2>
            <p className="text-gray-600">{userData?.role} - {userData?.department}</p>
          </div>
          <button 
            onClick={handleCheckIn}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Check In
          </button>
        </div>
      </div>
      
      {/* Earnings summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Current Earnings
            </h3>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {formatCurrency(earningsData?.currentPay)}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Current pay period ({earningsData?.hoursThisPeriod} hours)
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium text-gray-800">{formatCurrency(earningsData?.hourlyRate)}/hr</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Overtime Hours:</span>
                <span className="font-medium text-gray-800">{earningsData?.overtimeHours} hrs</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">YTD Earnings:</span>
                <span className="font-medium text-gray-800">{formatCurrency(earningsData?.ytdEarnings)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Next Payday:</span>
                <span className="font-medium text-gray-800">{formatDate(earningsData?.nextPayday)}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                View Full Pay History
              </button>
            </div>
          </div>
        </div>
        
        {/* Work Schedule / Calendar */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
          <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Work Schedule
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded text-blue-100 hover:text-white hover:bg-blue-500 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-white font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded text-blue-100 hover:text-white hover:bg-blue-500 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {/* Calendar day labels */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {generateCalendarCells()}
            </div>
            
            {/* Calendar legend */}
            <div className="mt-4 flex items-center justify-end space-x-4 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 mr-1"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 mr-1"></div>
                <span>Day Off</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 mr-1"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity and Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
          <div className="bg-purple-600 px-6 py-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
          </div>
          <div className="p-4">
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {activityData.map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'check-in' && (
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        {activity.type === 'check-out' && (
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'payroll' && (
                          <div className="p-2 bg-green-100 rounded-full">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        {activity.type === 'schedule' && (
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type === 'check-in' && `Checked in at ${activity.location}`}
                          {activity.type === 'check-out' && `Checked out from ${activity.location}`}
                          {(activity.type === 'payroll' || activity.type === 'schedule') && activity.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.time)} at {formatTime(activity.time)}
                        </p>
                      </div>
                      <div className="text-xs text-right text-gray-500">
                        {timeAgo(activity.time)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 text-center">
              <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                View All Activity
              </button>
            </div>
          </div>
        </div>
        
        {/* Employee Info */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-700 px-6 py-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Employee Information
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="text-sm font-medium text-gray-900">{userData?.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-sm font-medium text-gray-900">{userData?.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Manager</p>
                <p className="text-sm font-medium text-gray-900">{userData?.manager}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Joined</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(userData?.joinDate)}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Hours This Week</p>
            <p className="text-xl font-bold">32 / 40</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Paycheck</p>
            <p className="text-xl font-bold">{formatCurrency(earningsData?.lastPaycheck)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Time Off</p>
            <p className="text-xl font-bold">April 14-16</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;