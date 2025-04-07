// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Calendar, Users, Map, DollarSign, Clock, LogOut, Menu, X, TrendingUp } from 'lucide-react';

const Navbar = ({ isAuthenticated, userRole, currentPage, setCurrentPage, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  if (!isAuthenticated) return null;
  
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
      { id: 'checkin', label: 'Check-in', icon: <Map className="h-5 w-5" /> }    ];
  
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
                  onClick={() => setCurrentPage(item.id)}
                  className={`${
                    currentPage === item.id
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full`}
                >
                  <span className="hidden md:block">{item.label}</span>
                  <span className="block md:hidden">{item.icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* User Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <span className={`${
                userRole === 'Admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              } text-xs font-medium px-2.5 py-0.5 rounded`}>
                {userRole}
              </span>
              
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
              <div className="flex-grow">
                <div className="text-base font-medium text-gray-800">User</div>
                <div className="text-sm font-medium text-gray-500">{userRole}</div>
              </div>
              <div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;