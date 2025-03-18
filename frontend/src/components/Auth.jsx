// src/components/Auth.jsx
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const Auth = () => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login' or 'register'

  const handleSwitchToLogin = () => {
    setCurrentForm('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentForm('register');
  };

  return (
    <>
      {currentForm === 'login' ? (
        <LoginForm onSwitchToRegister={handleSwitchToRegister} />
      ) : (
        <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
      )}
    </>
  );
};

export default Auth;