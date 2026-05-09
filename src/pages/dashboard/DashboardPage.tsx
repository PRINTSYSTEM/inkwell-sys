import { useAuth } from "@/hooks";
import { ROLE } from "@/constants";
import AdminDashboard from "./AdminDashboard";
import AccountingDashboard from "./AccountingDashboard";
import type { UserRole } from "@/Schema";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role as UserRole;

  // Render role-specific dashboards
  if (role === ROLE.ADMIN) {
    return <AdminDashboard />;
  }

  if (role === ROLE.ACCOUNTING || role === ROLE.ACCOUNTING_LEAD) {
    return <AccountingDashboard />;
  }

  // Default dashboard for other roles (keep existing implementation if needed)
  // For now, fallback to AdminDashboard structure
  return <AdminDashboard />;
}
