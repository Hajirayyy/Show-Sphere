import React, { useEffect, useState } from 'react';
import axios from "../../services/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function DeleteAccountPage() {
  const nav = useNavigate();

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('/me', { withCredentials: true })
      .then(r => {
        setUser(r.data);
        setEmail(r.data.email || '');
      })
      .catch(() => nav('/login', { replace: true }));
  }, [nav]);

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return setMsg('⚠️ Please enter your email and password.');
    }

    if (confirmText !== 'DELETE') {
      return setMsg("⚠️ Please type 'DELETE' to confirm.");
    }

    const confirm = window.confirm(
      '⚠️ Final Confirmation:\n\nThis action will permanently delete your account. This cannot be undone.\n\nDo you still want to proceed?'
    );
    if (!confirm) return;

    setMsg('');
    setBusy(true);
    try {
      await axios.delete('/delete-account', {
        data: { email },
        auth: { username: email, password },
        withCredentials: true,
      });
      alert('✅ Your account has been deleted.');
      localStorage.clear();
      nav('/login', { replace: true });
    } catch (err) {
      setMsg(err?.response?.data?.message || err.message || '❌ Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#f3e7e9] to-[#e3eeff] p-6">
      <form
        onSubmit={handleDelete}
        className="bg-white w-full max-w-sm shadow-xl rounded-2xl px-8 py-8 space-y-6"
      >
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-purple-700">Delete Account</h1>
          <p className="text-gray-600 text-sm">
            This action will <strong>permanently</strong> delete your account and cannot be undone.
          </p>
        </header>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-800">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-72 p-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="pass" className="block text-sm font-medium text-gray-800">Password</label>
          <input
            id="pass"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-72 p-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-800">
            Type <span className="font-bold text-red-500">DELETE</span> to confirm
          </label>
          <input
            id="confirm"
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-72 p-2 rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {msg && (
          <p className="text-red-600 text-sm font-semibold text-center">{msg}</p>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <button
            type="submit"
            disabled={busy || confirmText !== 'DELETE'}
            className="flex-1 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete Account'}
          </button>

          <button
            type="button"
            onClick={() => nav(-1)}
            className="flex-1 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
