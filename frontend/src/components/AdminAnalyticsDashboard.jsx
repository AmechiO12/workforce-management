import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Users, MapPin, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const AdminAnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);
  
  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // Mock data - in a real application, this would fetch from your API
    
    // Employee data
    const employees = [
      { name: 'John', hours: 38, onTime: 18, late: 2 },
      { name: 'Sarah', hours: 40, onTime: 20, late: 0 },
      { name: 'Mike', hours: 32, onTime: 15, late: 1 },
      { name: 'Emma', hours: 37, onTime: 17, late: 3 },
      { name: 'David', hours: 40, onTime: 20, late: 0 },
    ];
    
    // Location check-in stats
    const locations = [
      { name: 'Main Office', value: 58 },
      { name: 'Downtown Branch', value: 27 },
      { name: 'Warehouse', value: 15 },
      { name: 'Remote', value: 10 },
    ];
    
    // Daily attendance rate
    const attendance = [
      { day: 'Mon', rate: 95 },
      { day: 'Tue', rate: 98 },
      { day: 'Wed', rate: 92 },
      { day: 'Thu', rate: 96 },
      { day: 'Fri', rate: 90 },
      { day: 'Sat', rate: 85 },
      { day: 'Sun', rate: 80 },
    ];
    
    // Payroll trend
    const payroll = [
      { period: 'Week 1', amount: 12500 },
      { period: 'Week 2', amount: 12300 },
      { period: 'Week 3', amount: 12900 },
      { period: 'Week 4', amount: 12700 },
    ];
    
    setEmployeeData(employees);
    setLocationData(locations);
    setAttendanceData(attendance);
    setPayrollData(payroll);
    
    setIsLoading(false);
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  const TitleCard = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-2 flex items-center">
          <TrendingUp className={`h-4 w-4 ${change >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
          <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}% from last {timeframe}
          </span>
        </div>
      )}
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Workforce Analytics</h2>
        
        <div className="bg-white shadow-sm rounded-lg p-1 flex space-x-1">
          <button 
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              timeframe === 'week' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button 
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              timeframe === 'month' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button 
            onClick={() => setTimeframe('quarter')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              timeframe === 'quarter' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Quarter
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TitleCard 
          title="Total Employees" 
          value="24" 
          change={5} 
          icon={<Users className="h-6 w-6" />} 
          color="blue" 
        />
        <TitleCard 
          title="Average Hours" 
          value="37.5" 
          change={2.3} 
          icon={<Clock className="h-6 w-6" />} 
          color="purple" 
        />
        <TitleCard 
          title="Attendance Rate" 
          value="94%" 
          change={-1.2} 
          icon={<Calendar className="h-6 w-6" />} 
          color="green" 
        />
        <TitleCard 
          title="Labor Cost" 
          value={formatCurrency(50400)} 
          change={3.8} 
          icon={<DollarSign className="h-6 w-6" />} 
          color="yellow" 
        />
      </div>
      
      {/* Employee Performance & Attendance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Employee Hours</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={employeeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    return [`${value} hours`, name];
                  }}
                />
                <Legend />
                <Bar dataKey="hours" fill="#8884d8" name="Hours Worked" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Daily Attendance Rate</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[70, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Attendance Rate']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Attendance Rate" 
                  stroke="#82ca9d" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Check-ins by Location</h3>
          <div className="h-80 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} check-ins`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Payroll Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={payrollData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                />
                <Legend />
                <Bar dataKey="amount" fill="#ffc658" name="Payroll Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Alerts and Insights */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
          Insights & Alerts
        </h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
            <h4 className="font-medium">Attendance Pattern</h4>
            <p className="text-sm text-gray-700">Attendance rate drops by an average of 5% on Fridays and weekends. Consider adjusting staffing accordingly.</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
            <h4 className="font-medium">Overtime Alert</h4>
            <p className="text-sm text-gray-700">3 employees are approaching overtime thresholds this week. Review schedules to optimize labor costs.</p>
          </div>
          
          <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
            <h4 className="font-medium">Productivity Insight</h4>
            <p className="text-sm text-gray-700">Downtown Branch has 15% higher productivity per labor hour compared to other locations.</p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Users className="h-5 w-5 mr-2" />
          Manage Staff
        </button>
        
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          <Calendar className="h-5 w-5 mr-2" />
          Schedule Shifts
        </button>
        
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <DollarSign className="h-5 w-5 mr-2" />
          Review Payroll
        </button>
        
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Export Report
        </button>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;