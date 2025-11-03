import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserManagement from './UserManagement';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/users" element={<UserManagement />} />
      <Route path="/" element={<Navigate to="/admin/users" replace />} />
    </Routes>
  );
};

export default AdminRoutes;