import React, { useState } from 'react';
import { signupUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [form, setForm] = useState({ userName: '', email: '', password: '', roleID: 1 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signupUser(form);
      alert('Signup successful! You can now log in.');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSignup}>
        <input name="userName" placeholder="Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <select name="roleID" onChange={handleChange} value={form.roleID}>
          <option value={1}>User</option>
          <option value={2}>Admin</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default SignupPage;
