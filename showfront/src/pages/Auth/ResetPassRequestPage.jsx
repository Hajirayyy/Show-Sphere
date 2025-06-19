import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService';

const ResetPasswordFormPage = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await resetPassword(email, token, newPassword);
      setMsg(res.message);
      setError('');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message || 'Reset failed');
      setMsg('');
    }
  };

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid or missing reset link.');
    }
  }, [email, token]);

  return (
    <div className="auth-container">
      <h2 className="form-title">Set New Password</h2>
      {msg && <p className="form-success">{msg}</p>}
      {error && <p className="form-error">{error}</p>}
      {!error && (
        <form onSubmit={handleSubmit}>
          <div className="password-group">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label className="toggle-eye">
              <input
                type="checkbox"
                checked={showPass}
                onChange={() => setShowPass(!showPass)}
              />
              Show Password
            </label>
          </div>
          <button type="submit">Update Password</button>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordFormPage;
