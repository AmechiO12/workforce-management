// src/components/Auth.jsx - Improved error handling and debugging

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import api from '../utils/api';

const Auth = () => {
  const [currentForm, setCurrentForm] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSwitchToLogin = () => {
    setCurrentForm('login');
    setError('');
    setSuccessMessage('');
  };

  const handleSwitchToRegister = () => {
    setCurrentForm('register');
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', { username });
      
      const response = await api.auth.login(username, password);
      
      console.log('Login response:', response);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Verify token was received and stored
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication failed: No token received');
        return;
      }
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.auth.register(userData);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      setSuccessMessage('Registration successful! You can now log in.');
      
      // Switch to login form after short delay
      setTimeout(() => {
        handleSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          {/* Form Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            {currentForm === 'login' ? 'Sign In to Your Account' : 'Create a New Account'}
          </h2>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <p>{successMessage}</p>
            </div>
          )}
          
          {/* Form Component */}
          {currentForm === 'login' ? (
            <LoginForm 
              onLogin={handleLogin}
              onSwitchToRegister={handleSwitchToRegister}
              isLoading={loading}
            />
          ) : (
            <RegisterForm 
              onRegister={handleRegister}
              onSwitchToLogin={handleSwitchToLogin}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;