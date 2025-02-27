// ✅ Dashboard.jsx (default export)
import React from 'react';
import { ChartBarIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">📊 Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Total Employees" value="25" Icon={UserIcon} />
        <SummaryCard title="Active Shifts" value="10" Icon={CheckCircleIcon} />
        <SummaryCard title="Payroll Processed" value="$12,500" Icon={ChartBarIcon} />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">📈 Attendance Overview</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
          <p>Chart will appear here...</p>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, Icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <Icon className="h-12 w-12 text-blue-500" />
    <div>
      <h4 className="text-gray-600 text-lg">{title}</h4>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;  // ✅ Default export
