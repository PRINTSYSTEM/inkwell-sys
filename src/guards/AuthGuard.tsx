import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Suspense } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('AuthGuard - user:', user, 'isLoading:', isLoading);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('User authenticated, rendering children');
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}