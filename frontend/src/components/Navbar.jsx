// frontend/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Map, DollarSign, Clock, LogOut, Menu, X, TrendingUp, User, Bell } from 'lucide-react';

const Navbar = ({ isAuthenticated, userRole, username, currentPage, setCurrentPage, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock notifications - in a real app, these would come from an API
  useEffect(() => {
    if (isAuthenticated) {
      setNotifications([
        { id: 1, message: 'Your shift starts in 1 hour', isRead: false },
        { id: 2, message: 'New schedule posted for next week', isRead: true },
        { id: 3, message: 'Payroll processed', isRead: true }
      ]);
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated) return null;
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Navigation items based on user role
  const navItems = userRole === 'Admin' 
  ? [
      { id: 'dashboard', label: 'Dashboard', icon: <Clock className="h-5 w-5" /> },
      { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-5 w-5" /> },
      { id: 'shifts', label: 'Shifts', icon: <Calendar className="h-5 w-5" /> },
      { id: 'locations', label: 'Locations', icon: <Map className="h-5 w-5" /> },
      { id: 'users', label: 'Employees', icon: <Users className="h-5 w-5" /> },
      { id: 'payroll', label: 'Invoices', icon: <DollarSign className="h-5 w-5" /> }
    ]
  : [
      { id: 'dashboard', label: 'Dashboard', icon: <Clock className="h-5 w-5" /> },
      { id: 'checkin', label: 'Check-in', icon: <Map className="h-5 w-5" /> }
    ];
  
  // Handle notification toggle
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, isRead: true} : n
    ));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, isRead: true})));
  };
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Logo */}
              <span className="text-xl font-bold text-blue-600">WMS</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${
                    currentPage === item.id
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span className="hidden md:block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* User Menu & Notifications */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No notifications</div>
                    ) : (
                      <div>
                        {notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 ${notification.isRead ? '' : 'bg-blue-50'}`}
                          >
                            <div className="flex justify-between">
                              <p className="text-sm text-gray-700">{notification.message}</p>
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-700">{username || 'User'}</span>
                <span className={`text-xs ${
                  userRole === 'Admin' 
                    ? 'text-purple-600'
                    : 'text-blue-600'
                }`}>
                  {userRole}
                </span>
              </div>
              
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                userRole === 'Admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <User className="h-4 w-4" />
              </div>
              
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`${
                  currentPage === item.id
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          
          {/* Mobile user menu */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                userRole === 'Admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <User className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{username || 'User'}</div>
                <div className="text-sm font-medium text-gray-500">{userRole}</div>
              </div>
              <div className="ml-auto">
                <button
                  onClick={toggleNotifications}
                  className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              {/* Notifications on mobile */}
              {showNotifications && (
                <div className="bg-gray-50 px-4 py-2 border-t border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notifications</h4>
                  {notifications.length === 0 ? (
                    <div className="py-1 text-sm text-gray-500">No notifications</div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-2 rounded text-sm ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
                        >
                          {notification.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;