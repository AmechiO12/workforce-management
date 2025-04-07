// frontend/src/components/WorkforceManagementApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import CheckInForm from './CheckInForm';
import LocationsManagement from './LocationsManagement';
import UserManagement from './UserManagement';
import ShiftManagement from './ShiftManagement';
import PayrollManagement from './PayrollManagement';
import api from '../utils/api';
import EnhancedShiftManagement from './EnhancedShiftManagement';
import EnhancedEmployeeDashboard from './EnhancedEmployeeDashboard';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';

const WorkforceManagementApp = () => {
  const navigate = useNavigate();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role || 'Employee');
      setIsLoading(false);
    } else {
      // Redirect to login if no token found
      navigate('/login');
    }
  }, [navigate]);
  
  // Handle logout
  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
  };
  
  // Handle page changes for SPA navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Render loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    // Admin view
    if (userRole === 'Admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard onPageChange={handlePageChange} />;
        case 'analytics':
          return <AdminAnalyticsDashboard />;
        case 'checkin':
          return <CheckInForm />;
        case 'locations':
          return <LocationsManagement />;
        case 'users':
          return <UserManagement />;
        case 'shifts':
          return <EnhancedShiftManagement />;
        case 'payroll':
          return <PayrollManagement />;
        default:
          return <AdminDashboard onPageChange={handlePageChange} />;
      }
    } 
    // Employee view
    else {
      switch (currentPage) {
        case 'dashboard':
          return <EnhancedEmployeeDashboard onPageChange={handlePageChange} />;
        case 'checkin':
          return <CheckInForm />;
        default:
          return <EnhancedEmployeeDashboard onPageChange={handlePageChange} />;
      }
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