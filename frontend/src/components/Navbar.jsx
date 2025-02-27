import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from './hooks/useAuth';


const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null; // 🚫 Hide navbar if not logged in

  return (
    <nav className="navbar">
      <h2>Workforce Management System</h2>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/attendance">Attendance</Link>
        <Link to="/payroll">Payroll</Link>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
