// frontend/src/components/EnhancedEmployeeDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, DollarSign, TrendingUp, User, Repeat, Bell, MessageSquare, Plus } from 'lucide-react';
import enhancedApi from '../utils/enhancedApi';

// Shift Requests Component
const ShiftRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch shift requests data when the component mounts
  useEffect(() => {
    // Future implementation: fetch actual shift requests from API
    // For now, this will just initialize with an empty array
    setRequests([]);
  }, []);
  
  const handleAccept = async (requestId) => {
    // Future implementation: accept request via API
    setRequests(requests.map(req => 
      req.id === requestId ? {...req, status: 'accepted'} : req
    ));
  };
  
  const handleDecline = async (requestId) => {
    // Future implementation: decline request via API
    setRequests(requests.map(req => 
      req.id === requestId ? {...req, status: 'declined'} : req
    ));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Repeat className="h-5 w-5 mr-2 text-purple-600" />
        Shift Exchange Requests
      </h3>
      
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'incoming'
              ? 'border-b-2 border-purple-500 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'outgoing'
              ? 'border-b-2 border-purple-500 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('outgoing')}
        >
          My Requests
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active shift requests
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(request => (
            <div key={request.id} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    request.requestType === 'swap' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {request.requestType === 'swap' ? 'Swap' : 'Coverage'}
                  </span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {new Date(request.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {request.shift} • Requested by {request.requestedBy}
                </p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {request.status === 'pending' && activeTab === 'incoming' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAccept(request.id)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(request.id)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'outgoing' && (
        <div className="mt-4">
          <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <Plus className="h-4 w-4 mr-2" />
            New Shift Request
          </button>
        </div>
      )}
    </div>
  );
};

// Notifications Component
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Future implementation: fetch actual notifications from API
    // For now, this will just initialize with an empty array
    setNotifications([]);
  }, []);
  
  const markAsRead = async (id) => {
    // Future implementation: mark as read via API
    setNotifications(notifications.map(note => 
      note.id === id ? {...note, isRead: true} : note
    ));
  };
  
  const markAllAsRead = async () => {
    // Future implementation: mark all as read via API
    setNotifications(notifications.map(note => ({...note, isRead: true})));
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Bell className="h-5 w-5 mr-2 text-blue-600" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`border rounded-lg p-3 ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    {notification.type === 'schedule' && <Calendar className="h-4 w-4 text-purple-600 mr-2" />}
                    {notification.type === 'swap' && <Repeat className="h-4 w-4 text-blue-600 mr-2" />}
                    {notification.type === 'system' && <Bell className="h-4 w-4 text-green-600 mr-2" />}
                    <span className="text-sm font-medium text-gray-900">{notification.message}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
                
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {notifications.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

// Team Chat Component
const TeamChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Future implementation: fetch actual team messages from API
    // For now, this will just initialize with an empty array
    setMessages([]);
  }, []);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Future implementation: send message via API
    // For testing, we'll just add it locally
    const message = {
      id: Date.now(), // Temporary ID
      sender: 'You',
      content: newMessage,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
        Team Chat
      </h3>
      
      <div className="h-60 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-md">
        {messages.map(message => (
          <div key={message.id} className="mb-3">
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-sm">{message.sender}</span>
              <span className="text-xs text-gray-500">{message.time}</span>
            </div>
            <p className="text-sm mt-1">{message.content}</p>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-l-md border-gray-300 focus:border-green-500 focus:ring-green-500"
        />
        <button
          type="submit"
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

// Main Enhanced Employee Dashboard Component
const EnhancedEmployeeDashboard = ({ onPageChange, userData, dashboardData, onDataUpdate }) => {
  // State hooks for different data points
  const [isLoading, setIsLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Effect to handle dashboard data from props
  useEffect(() => {
    if (dashboardData) {
      setEmployeeData(userData || dashboardData.userData);
      setEarningsData(dashboardData.earnings);
      setActivityData(dashboardData.activityData || []);
      setScheduleData(dashboardData.schedule || []);
      setIsLoading(false);
    } else {
      // If no dashboard data is provided, fetch it directly
      fetchDashboardData();
    }
  }, [dashboardData, userData]);
  
  // Fetch dashboard data if not provided through props
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get user data
      const userDataResponse = await enhancedApi.dashboard.getEmployeeData();
      if (!userDataResponse.error) {
        setEmployeeData(userDataResponse);
      }
      
      // Get earnings data
      const earningsResponse = await enhancedApi.dashboard.getEarningsData();
      if (!earningsResponse.error) {
        setEarningsData(earningsResponse);
      }
      
      // Get recent activity
      const activityResponse = await enhancedApi.dashboard.getRecentActivity(5);
      if (Array.isArray(activityResponse)) {
        setActivityData(activityResponse);
      }
      
      // Get schedule data for current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const scheduleResponse = await enhancedApi.dashboard.getScheduleData(year, month);
      if (Array.isArray(scheduleResponse)) {
        setScheduleData(scheduleResponse);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Format dates in a friendly way
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Handle check-in button click
  const handleCheckIn = () => {
    if (onPageChange) {
      onPageChange('checkin');
    }
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
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {employeeData?.name}!</h2>
            <p className="text-gray-600">{employeeData?.role} - {employeeData?.department}</p>
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
              Current pay period ({earningsData?.hoursThisPeriod || 0} hours)
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium text-gray-800">{formatCurrency(earningsData?.hourlyRate)}/hr</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Overtime Hours:</span>
                <span className="font-medium text-gray-800">{earningsData?.overtimeHours || 0} hrs</span>
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
          </div>
        </div>
        
        {/* Enhanced Dashboard Features */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Work Schedule
              </h3>
            </div>
            <div className="p-6">
              {scheduleData && scheduleData.length > 0 ? (
                <div className="space-y-3">
                  {scheduleData.slice(0, 7).map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <div>
                        <div className="font-medium">
                          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-500">{item.location}</div>
                      </div>
                      {item.shift === 'Off' ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">Day Off</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">{item.shift}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No upcoming shifts scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced dashboard features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShiftRequests />
        <Notifications />
      </div>
      
      <TeamChat />
      
      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-purple-600 px-6 py-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
        </div>
        <div className="p-4">
          {activityData && activityData.length > 0 ? (
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {activityData.map((activity, index) => (
                  <li key={activity.id || index} className="py-4">
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
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type === 'check-in' && `Checked in at ${activity.location || 'work'}`}
                          {activity.type === 'check-out' && `Checked out from ${activity.location || 'work'}`}
                          {activity.type === 'payroll' && (activity.description || 'Payroll processed')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity to display</p>
            </div>
          )}
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
            <p className="text-xl font-bold">{earningsData?.weeklyHours || '0'} / 40</p>
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
            <p className="text-sm text-gray-500">Next Scheduled Shift</p>
            <p className="text-xl font-bold">
              {scheduleData && scheduleData.length > 0 
                ? new Date(scheduleData[0].date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
                : 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEmployeeDashboard;
