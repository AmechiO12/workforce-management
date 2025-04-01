import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import CheckInForm from './CheckInForm';
import LocationsManagement from './LocationsManagement';
import UserManagement from './UserManagement';
import PayrollManagement from './PayrollManagement';
import api from '../utils/api';

const WorkforceManagementApp = () => {
  const navigate = useNavigate();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role || 'Employee');
    } else {
      // Redirect to login if no token found
      navigate('/login');
    }
  }, [navigate]);
  
  // Handle logout
  const handleLogout = () => {
    api.auth.logout(); // Using the API service for logout
    setIsAuthenticated(false);
  };
  
  // Handle page changes for SPA navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Render loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Main content based on current page
  const renderContent = () => {
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
    <div className="min-h-screen bg-gray-100">
      <Navbar
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default WorkforceManagementApp;