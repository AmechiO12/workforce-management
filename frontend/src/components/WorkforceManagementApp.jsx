import React, { useState } from 'react';

// Main App Component
const WorkforceManagementApp = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('Employee');

  // Simulate login functionality
  const handleLogin = (token) => {
    localStorage.setItem('access_token', token || 'sample-token');
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  // Simulate logout functionality
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  // Render the navigation bar for authenticated users
  const renderNavbar = () => {
    if (!isAuthenticated) return null;
    
    return (
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Workforce Management System</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3 py-2 rounded ${currentPage === 'dashboard' ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentPage('checkin')}
              className={`px-3 py-2 rounded ${currentPage === 'checkin' ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`}
            >
              Check-in
            </button>
            {userRole === 'Admin' && (
              <>
                <button 
                  onClick={() => setCurrentPage('locations')}
                  className={`px-3 py-2 rounded ${currentPage === 'locations' ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`}
                >
                  Locations
                </button>
                <button 
                  onClick={() => setCurrentPage('users')}
                  className={`px-3 py-2 rounded ${currentPage === 'users' ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`}
                >
                  Users
                </button>
              </>
            )}
            <button 
              onClick={() => setCurrentPage('payroll')}
              className={`px-3 py-2 rounded ${currentPage === 'payroll' ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}`}
            >
              Payroll
            </button>
            <button 
              onClick={handleLogout}
              className="ml-4 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  };

  // Render appropriate content based on current page
  const renderContent = () => {
    if (!isAuthenticated) {
      return <LoginForm onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'checkin':
        return <CheckInForm />;
      case 'locations':
        return <LocationsManagement />;
      case 'users':
        return <UserManagement />;
      case 'payroll':
        return <PayrollManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderNavbar()}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

// Login Component
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    // In a real app, you would make an API call here
    // Simulating successful login
    onLogin('sample-token');
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to Workforce Management</h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Employees</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Today's Check-ins</p>
              <p className="text-2xl font-bold">18</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500 text-white mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Monthly Payroll</p>
              <p className="text-2xl font-bold">$32,450</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="border-t border-gray-200">
          <p className="py-3 text-gray-600">John Smith checked in at Headquarters at 8:30 AM</p>
          <p className="py-3 text-gray-600">Sarah Johnson checked in at Remote Office at 8:45 AM</p>
          <p className="py-3 text-gray-600">New employee James Wilson was added by Admin</p>
          <p className="py-3 text-gray-600">Payroll for February was processed</p>
        </div>
      </div>
    </div>
  );
};

// Check-in Component
const CheckInForm = () => {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Check In</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Location
        </label>
        <select className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          <option>Headquarters</option>
          <option>Remote Office</option>
          <option>Care Facility A</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Your Location
        </label>
        <div className="bg-gray-100 p-3 rounded">
          <p className="text-sm">Latitude: 37.7749</p>
          <p className="text-sm">Longitude: -122.4194</p>
        </div>
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
          Get Current Location
        </button>
      </div>
      
      <button className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
        Check In
      </button>
    </div>
  );
};

// Locations Management Component
const LocationsManagement = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Locations Management</h2>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          + Add Location
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitude</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitude</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radius (km)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Headquarters</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">37.7749</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-122.4194</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.0</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                <button className="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Remote Office</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">34.0522</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-118.2437</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.5</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                <button className="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          + Add User
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">admin</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin@example.com</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                  Admin
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-blue-600 hover:text-blue-900">Edit</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">john_doe</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">john@example.com</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Employee
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-blue-600 hover:text-blue-900">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Payroll Management Component
const PayrollManagement = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payroll Management</h2>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Export to Excel
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter Payroll</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
            <input type="date" className="shadow border rounded py-2 px-3 text-gray-700" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
            <input type="date" className="shadow border rounded py-2 px-3 text-gray-700" />
          </div>
          <div className="self-end">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Apply Filter
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Hours</p>
              <p className="text-2xl font-bold">632.5</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Pay</p>
              <p className="text-2xl font-bold">$9,487.50</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">admin</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">160.0</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$2,400.00</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">john_doe</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">152.5</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$2,287.50</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkforceManagementApp;