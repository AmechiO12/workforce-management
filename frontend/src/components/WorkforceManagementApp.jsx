import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Dashboard from './Dashboard';
import CheckInForm from './CheckInForm';
import LocationsManagement from './LocationsManagement';
import UserManagement from './UserManagement';
import PayrollManagement from './PayrollManagement';

const WorkforceManagementApp = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('Employee');
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for existing authentication on load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Validate token with backend in a real app
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      // You would get user role from token or API
      setUserRole(localStorage.getItem('user_role') || 'Employee');
    }
    setIsLoading(false);
  }, []);

  // Handle login
  const handleLogin = (token, role = 'Employee') => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', role);
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentPage('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  // Switch to registration page
  const handleSwitchToRegister = () => {
    setCurrentPage('register');
  };

  // Switch to login page
  const handleSwitchToLogin = () => {
    setCurrentPage('login');
  };

  // Render loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render appropriate content based on current page
  const renderContent = () => {
    if (!isAuthenticated) {
      if (currentPage === 'register') {
        return <RegisterForm onSwitchToLogin={handleSwitchToLogin} />;
      }
      return <LoginForm onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'checkin':
        return <CheckInForm />;
      case 'locations':
        return userRole === 'Admin' ? <LocationsManagement /> : <Dashboard />;
      case 'users':
        return userRole === 'Admin' ? <UserManagement /> : <Dashboard />;
      case 'payroll':
        return <PayrollManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
      
      {isAuthenticated && (
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Workforce Management System. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default WorkforceManagementApp;