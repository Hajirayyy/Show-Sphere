import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axiosInstance';

const UserManager = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleDelete = async (userID) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axiosInstance.delete(`/api/users/${userID}`);
      setUsers((prev) => prev.filter((user) => user.userID !== userID));
      alert('🗑️ User deleted successfully!');
    } catch (err) {
      console.error('❌ Failed to delete user:', err);
      alert('Failed to delete user.');
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={title}>👥 User Management</h2>
        <ul style={list}>
          {users.map((user) => (
            <li key={user.userID} style={listItem}>
              <span>{user.userName} ({user.email})</span>
              <button style={deleteBtn} onClick={() => handleDelete(user.userID)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const container = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px 20px',
  minHeight: '100vh',
  background: 'linear-gradient(to right, #f3e7e9, #e3eeff)'
};

const card = {
  width: '100%',
  maxWidth: '700px',
  background: '#fff',
  padding: '2rem 2.5rem',
  borderRadius: '18px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
};

const title = {
  fontSize: '26px',
  color: '#5e35b1',
  textAlign: 'center',
  marginBottom: '20px'
};

const list = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const listItem = {
  backgroundColor: '#fdfaff',
  padding: '12px 18px',
  marginBottom: '12px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const deleteBtn = {
  backgroundColor: '#c62828',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

export default UserManager;
