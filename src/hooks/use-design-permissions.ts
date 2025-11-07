import { useAuth } from '@/hooks/use-auth';
import { rolePermissions } from '@/lib/permissions';

export const useDesignPermissions = () => {
  const { user } = useAuth();
  
  if (!user?.role) {
    return {
      canViewDesignManagement: false,
      canManageAssignments: false,
      canViewPerformance: false,
      canAssignTasks: false,
      canViewDepartmentStats: false
    };
  }

  const permissions = rolePermissions[user.role as keyof typeof rolePermissions];
  
  return {
    canViewDesignManagement: user.role === 'designer_manager' || user.role === 'admin',
    canManageAssignments: permissions?.canManageDesignAssignments || user.role === 'admin',
    canViewPerformance: permissions?.canViewDesignerPerformance || user.role === 'admin',
    canAssignTasks: permissions?.canAssignDesignTasks || user.role === 'admin',
    canViewDepartmentStats: permissions?.canViewDepartmentStats || user.role === 'admin'
  };
};

export default useDesignPermissions;