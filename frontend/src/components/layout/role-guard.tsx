'use client';

import { ReactNode } from 'react';
import { useRoleAccess, UserRole } from '@/hooks/useRoleAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles: UserRole | UserRole[];
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export default function RoleGuard({ 
  children, 
  requiredRoles, 
  fallback,
  showAccessDenied = true 
}: RoleGuardProps) {
  const { hasRole, userRole } = useRoleAccess();
  
  if (hasRole(requiredRoles)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showAccessDenied) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span>Required role: {Array.isArray(requiredRoles) ? requiredRoles.join(' or ') : requiredRoles}</span>
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              Your role: {userRole}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Please contact your administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
