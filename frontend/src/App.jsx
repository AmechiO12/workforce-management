import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';         // ✅ Confirm ./pages/Home exists
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';  // ✅ No curly braces for default import
import Navbar from './components/Navbar'; // ✅ Confirm ./components/Navbar exists
import useAuth from "./components/hooks/useAuth";
import './index.css';  // ✅ Ensure this line exists and points correctly




function App() {
  const { isAuthenticated } = useAuth();  // 🔒 Check if user is authenticated

  return (
    <Router>
      {/* 🌐 Navbar is visible on all pages */}
      {isAuthenticated && <Navbar />}
      <Navbar />
      <div className="container mx-auto p-6">
        <Routes>
          {/* 🏠 Home page for Login & Registration */}
          <Route path="/" element={<Home />} />

          {/* 🔒 Protected Routes - Only accessible if logged in */}
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/attendance"
            element={isAuthenticated ? <Attendance /> : <Navigate to="/" replace />}
          />
          <Route
            path="/payroll"
            element={isAuthenticated ? <Payroll /> : <Navigate to="/" replace />}
          />

          {/* 🌐 Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
