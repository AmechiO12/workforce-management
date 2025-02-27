import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = showLogin ? '/auth/login' : '/auth/register';
      const payload = showLogin
        ? { username: formData.username, password: formData.password }
        : formData;

      const response = await api.post(endpoint, payload);
      if (response.status === 200 || response.status === 201) {
        alert(showLogin ? 'Login successful!' : 'Registration successful!');
        localStorage.setItem('access_token', response.data.access_token); // Save token
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  return (
    <div className="home-container">
      <h1 className="title">Workforce Management System</h1>
      <div className="form-container">
        <div className="toggle-buttons">
          <button
            className={showLogin ? 'active-btn' : 'inactive-btn'}
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>
          <button
            className={!showLogin ? 'active-btn' : 'inactive-btn'}
            onClick={() => setShowLogin(false)}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {!showLogin && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleFormChange}
              required
            />
          )}
          {showLogin ? (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleFormChange}
              required
            />
          ) : (
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleFormChange}
              required
            />
          )}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleFormChange}
            required
          />
          {error && <p className="error-msg">{error}</p>}
          <button className="submit-btn" type="submit">
            {showLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
