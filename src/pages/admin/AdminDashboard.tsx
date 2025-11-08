import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import DepartmentAnalytics from './DepartmentAnalytics';
import AdminPermissions from './AdminPermissions';
import AdminSettings from './AdminSettings';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/users" element={<UserManagement />} />
      <Route path="/roles" element={<RoleManagement />} />
      <Route path="/analytics" element={<DepartmentAnalytics />} />
      <Route path="/permissions" element={<AdminPermissions />} />
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="/" element={<Navigate to="/admin/users" replace />} />
    </Routes>
  );
};

export default AdminRoutes;