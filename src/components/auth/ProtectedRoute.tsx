import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import type { ModuleName } from '@/types/users';
import { Loader2 } from 'lucide-react';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: ModuleName;
}

export function ProtectedRoute({ 
  children, 
  requiredModule
}: ProtectedRouteProps) {
  const { user, session, loading: authLoading } = useAuth();
  const { hasModuleAccess, isLoading: permLoading, isActive } = usePermissions();
  const location = useLocation();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user || !session || !session.access_token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while checking permissions (only after auth is confirmed)
  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User is deactivated
  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Conta Desativada</h1>
          <p className="text-muted-foreground mt-2">
            Sua conta foi desativada. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  // Check module access - show access denied if no permission
  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
