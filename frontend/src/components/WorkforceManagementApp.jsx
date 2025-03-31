// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const DashboardCard = ({ icon, title, value, bgColor, textColor }) => (
  <div className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
    <div className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColor} ${textColor} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayCheckins: 0,
    monthlyPayroll: 0,
    upcomingAbsences: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [error, setError] = useState(null);

  // Load user role from localStorage on component mount
  useEffect(() => {
    const role = localStorage.getItem('user_role') || 'Employee';
    setUserRole(role);
    
    // Fetch dashboard data based on role
    fetchDashboardData(role);
  }, []);

  // Fetch appropriate dashboard data based on user role
  const fetchDashboardData = async (role) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Common data for all users
      const userDataResponse = await api.dashboard.getEmployeeData();
      const activityResponse = await api.dashboard.getRecentActivity();

      // Set user data
      if (userDataResponse.error) {
        console.error("Error fetching user data:", userDataResponse.error);
        setError("Failed to load user information");
      } else {
        setUserData(userDataResponse);
      }

      // Set activity data
      if (activityResponse.error) {
        console.error("Error fetching activity data:", activityResponse.error);
      } else {
        setRecentActivities(activityResponse);
      }

      // Role-specific data for admins
      if (role === 'Admin') {
        // Fetch admin-specific statistics
        // This would typically come from your API, mocking it for now
        setStats({
          totalEmployees: 24,
          todayCheckins: 18,
          monthlyPayroll: 42500,
          upcomingAbsences: 3
        });
      } else {
        // For regular employees, fetch their personal stats
        const earningsResponse = await api.dashboard.getEarningsData();
        
        if (earningsResponse.error) {
          console.error("Error fetching earnings data:", earningsResponse.error);
        } else {
          // Set employee-specific stats
          setStats({
            hoursThisPeriod: earningsResponse.hoursThisPeriod || 0,
            currentPay: earningsResponse.currentPay || 0,
            nextPayday: earningsResponse.nextPayday || 'Not scheduled',
            ytdEarnings: earningsResponse.ytdEarnings || 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Common header for all users */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {userRole === 'Admin' ? 'Administration Dashboard' : 'Employee Dashboard'}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => fetchDashboardData(userRole)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
          {userRole === 'Admin' && (
            <button className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Export Data
            </button>
          )}
        </div>
      </div>
      
      {/* User welcome section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">
          {userData ? `Welcome, ${userData.name}` : 'Welcome'}
        </h3>
        <p className="text-gray-600">
          {userData && userData.department && (
            <span className="block mb-2">Department: {userData.department}</span>
          )}
          {userData && userData.joinDate && (
            <span>Employee since: {new Date(userData.joinDate).toLocaleDateString()}</span>
          )}
        </p>
      </div>
      
      {/* Role-based statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === 'Admin' ? (
          /* Admin stats */
          <>
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              title="Total Employees"
              value={stats.totalEmployees}
              bgColor="bg-blue-100"
              textColor="text-blue-600"
            />
            
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="Today's Check-ins"
              value={stats.todayCheckins}
              bgColor="bg-green-100"
              textColor="text-green-600"
            />
            
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Monthly Payroll"
              value={`$${stats.monthlyPayroll.toLocaleString()}`}
              bgColor="bg-yellow-100"
              textColor="text-yellow-600"
            />
            
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title="Upcoming Absences"
              value={stats.upcomingAbsences}
              bgColor="bg-purple-100"
              textColor="text-purple-600"
            />
          </>
        ) : (
          /* Employee stats */
          <>
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Hours This Period"
              value={stats.hoursThisPeriod?.toFixed(1) || 0}
              bgColor="bg-blue-100"
              textColor="text-blue-600"
            />
            
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Current Pay"
              value={`$${stats.currentPay?.toLocaleString() || 0}`}
              bgColor="bg-green-100"
              textColor="text-green-600"
            />
            
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title="Next Payday"
              value={stats.nextPayday || 'N/A'}
              bgColor="bg-yellow-100"
              textColor="text-yellow-600"
            />
            
            <DashboardCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="YTD Earnings"
              value={`$${stats.ytdEarnings?.toLocaleString() || 0}`}
              bgColor="bg-purple-100"
              textColor="text-purple-600"
            />
          </>
        )}
      </div>
      
      {/* Recent activity - same for both roles */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                      activity.type === 'check-in' ? 'bg-green-100 text-green-600' :
                      activity.type === 'check-out' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'check-in' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {activity.type === 'check-out' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                      {activity.type === 'payroll' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-700">
                        {activity.type === 'check-in' && `Checked in at ${activity.location || 'work'}`}
                        {activity.type === 'check-out' && `Checked out from ${activity.location || 'work'}`}
                        {activity.type === 'payroll' && (activity.description || 'Payroll processed')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {activity.time ? new Date(activity.time).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 bg-gray-50 text-right rounded-b-lg">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Activity
          </button>
        </div>
      </div>
      
      {/* Admin-only section */}
      {userRole === 'Admin' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/users'} 
              className="flex items-center justify-center p-4 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Manage Users</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/locations'} 
              className="flex items-center justify-center p-4 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Manage Locations</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/payroll'} 
              className="flex items-center justify-center p-4 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Manage Payroll</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;