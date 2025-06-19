import React, { useState } from 'react';
import { requestPasswordReset } from '../../services/authService';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await requestPasswordReset(email);
      setMsg(res.message);
      setError('');
    } catch (err) {
      setError(err.message);
      setMsg('');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="form-title">Reset Password</h2>
      {msg && <p className="form-success">{msg}</p>}
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
