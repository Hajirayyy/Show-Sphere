import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { roleID, userName, userID } = await loginUser(email, password);

      // Store role in localStorage so ProtectedRoute works
      localStorage.setItem('roleID', roleID);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userID', userID);  

      // Redirect based on role
      if (Number(roleID) === 1) {
        navigate('/user');
      } else if (Number(roleID) === 2) {
        navigate('/admin');
      } else {
        setError('Unknown role. Contact admin.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
      <p>
        <a href="/reset-password">Forgot Password?</a>
      </p>
    </div>
  );
};

export default LoginPage;
