import React, { useEffect, useState } from 'react';
import axios from '../../services/axiosInstance';

const UserManager = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (userID) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/users/${userID}`);
      alert('🗑️ User deleted successfully!');
      fetchUsers();
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Delete failed');
    }
  };

  return (
    <div style={container}>
      <div style={contentBox}>
        <h2 style={titleStyle}>👥 User Management</h2>
        {users.length > 0 ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Username</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userID}>
                  <td style={td}>{user.userID}</td>
                  <td style={td}>{user.userName}</td>
                  <td style={td}>{user.email}</td>
                  <td style={td}>{user.role}</td>
                  <td style={td}>
                    <button onClick={() => deleteUser(user.userID)} style={deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
};

const container = {
  background: 'linear-gradient(to right, #f3e7e9, #e3eeff)',
  minHeight: '100vh',
  padding: '3rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const contentBox = {
  backgroundColor: '#ffffff',
  padding: '2rem 2.5rem',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: '900px'
};

const titleStyle = {
  textAlign: 'center',
  fontSize: '28px',
  fontWeight: '600',
  color: '#5e35b1',
  marginBottom: '1rem'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const th = {
  padding: '12px',
  backgroundColor: '#5e35b1',
  color: '#fff',
  textAlign: 'left'
};

const td = {
  padding: '12px',
  color: "black",
  borderBottom: '1px solid #ccc'
};

const deleteBtn = {
  padding: '8px 12px',
  backgroundColor: '#e53935',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default UserManager;