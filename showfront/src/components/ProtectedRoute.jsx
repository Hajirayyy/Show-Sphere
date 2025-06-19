import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const storedRole = parseInt(localStorage.getItem('roleID'));

  if (!storedRole || storedRole !== (role === 'Admin' ? 2 : 1)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
