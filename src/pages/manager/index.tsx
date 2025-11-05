import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerDashboard from '../dashboard/ManagerDashboard';
import EmployeeDetailView from './EmployeeDetailView';
import EmployeePerformanceTracking from './EmployeePerformanceTracking';
import EmployeeAssignmentInterface from './EmployeeAssignmentInterface';

const ManagerRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<ManagerDashboard />} />
      <Route path="/employees/:employeeId" element={<EmployeeDetailView />} />
      <Route path="/performance" element={<EmployeePerformanceTracking />} />
      <Route path="/assignments" element={<EmployeeAssignmentInterface />} />
      <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
    </Routes>
  );
};

export default ManagerRoutes;