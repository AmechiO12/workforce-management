import React, { useState, useEffect } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayCheckins: 0,
    monthlyPayroll: 0
  });
  const [activities, setActivities] = useState([]);

  // Simulate data loading
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Export Data
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex justify-between">
                <p className="text-gray-700">{activity.text}</p>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 text-right rounded-b-lg">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;