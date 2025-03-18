// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WorkforceManagementApp from './components/WorkforceManagementApp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Auth from './components/Auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/*" element={<WorkforceManagementApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;