// frontend/src/components/WorkforceManagementApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import CheckInForm from './CheckInForm';
import CheckOutForm from './CheckOutForm';
import LocationsManagement from './LocationsManagement';
import UserManagement from './UserManagement';
import ShiftManagement from './ShiftManagement';
import PayrollManagement from './PayrollManagement';
import EnhancedEmployeeDashboard from './EnhancedEmployeeDashboard';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import enhancedApi from '../utils/enhancedApi';

const WorkforceManagementApp = () => {
  const navigate = useNavigate();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0); // Used to trigger data reloads
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      
      if (!token) {
        // Redirect to login if no token found
        navigate('/login');
        return;
      }
      
      // Set initial auth state
      setIsAuthenticated(true);
      setUserRole(role || 'Employee');
      
      // Fetch user data to validate the token and get initial data
      try {
        // Use the enhanced API to get dashboard data
        await fetchDashboardData();
        setIsLoading(false);
      } catch (error) {
        console.error("Authentication error:", error);
        // If there's an auth error, redirect to login
        handleLogout();
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Fetch dashboard data - THIS IS THE KEY CHANGE
  // Now it will ALWAYS fetch new data when reload changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Reload triggered, fetching new dashboard data...");
      fetchDashboardData();
    }
  }, [reload, isAuthenticated]);
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching dashboard data...");
      const data = await enhancedApi.dashboard.getUnifiedDashboardData();
      console.log("Dashboard data received:", data);
      
      if (data && data.error) {
        setError(data.error);
      } else if (data) {
        setDashboardData(data);
        setUserData(data.userData);
      } else {
        setError("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    enhancedApi.auth.logout();
    setIsAuthenticated(false);
    setUserData(null);
    navigate('/login');
  };
  
  // Handle page changes for SPA navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // If going to dashboard, refresh data
    if (page === 'dashboard') {
      fetchDashboardData();
    }
  };
  
  // Handle data refresh for modules
  const handleDataUpdate = () => {
    console.log("Data update requested. Triggering reload...");
    // Increment reload to trigger useEffect
    setReload(prev => prev + 1);
  };
  
  // Render loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render the appropriate content based on user role and current page
  const renderContent = () => {
    // Admin view
    if (userRole === 'Admin') {
      switch (currentPage) {
        case 'dashboard':
          return (
            <AdminDashboard 
              onPageChange={handlePageChange} 
              dashboardData={dashboardData}
              onDataUpdate={handleDataUpdate}
            />
          );
        case 'analytics':
          return <AdminAnalyticsDashboard />;
        case 'checkin':
          return (
            <CheckInForm 
              onCheckInComplete={handleDataUpdate}
            />
          );
        case 'checkout':
          return (
            <CheckOutForm 
              onCheckOutComplete={handleDataUpdate}
            />
          );
        case 'locations':
          return (
            <LocationsManagement 
              onDataChange={handleDataUpdate}
            />
          );
        case 'users':
          return (
            <UserManagement 
              onDataChange={handleDataUpdate}
            />
          );
        case 'shifts':
          return (
            <ShiftManagement 
              onDataChange={handleDataUpdate}
            />
          );
        case 'payroll':
          return <PayrollManagement />;
        default:
          return (
            <AdminDashboard 
              onPageChange={handlePageChange} 
              dashboardData={dashboardData}
              onDataUpdate={handleDataUpdate}
            />
          );
      }
    } 
    // Employee view
    else {
      switch (currentPage) {
        case 'dashboard':
          return (
            <EnhancedEmployeeDashboard 
              onPageChange={handlePageChange} 
              userData={userData}
              dashboardData={dashboardData}
              onDataUpdate={handleDataUpdate}
            />
          );
        case 'checkin':
          return (
            <CheckInForm 
              onCheckInComplete={handleDataUpdate}
            />
          );
        case 'checkout':
          return (
            <CheckOutForm 
              onCheckOutComplete={handleDataUpdate}
            />
          );
        default:
          return (
            <EnhancedEmployeeDashboard 
              onPageChange={handlePageChange} 
              userData={userData}
              dashboardData={dashboardData}
              onDataUpdate={handleDataUpdate}
            />
          );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Display any error messages at the top of the page */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Navigation bar with user role and page selection */}
      <Navbar
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        username={userData?.name || localStorage.getItem('username')}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        onLogout={handleLogout}
      />
      
      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default WorkforceManagementApp;