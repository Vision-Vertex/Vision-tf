'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Settings, 
  Activity, 
  AlertTriangle, 
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      window.location.href = '/login';
      return;
    }

    // Mock user data for demo
    setUser({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      firstname: 'John',
      lastname: 'Doe',
      role: 'CLIENT',
      isEmailVerified: true,
      isTwoFactorEnabled: false
    });
    setIsLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionToken');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionToken');
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Vision TF Dashboard</h1>
              <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user?.role}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstname} {user?.lastname}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <span className="text-sm">{user?.firstname} {user?.lastname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Username:</span>
                  <span className="text-sm">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Role:</span>
                  <Badge variant="outline" className="text-xs">
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Email Verified:</span>
                  <Badge variant={user?.isEmailVerified ? 'default' : 'destructive'} className="text-xs">
                    {user?.isEmailVerified ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">2FA Enabled:</span>
                  <Badge variant={user?.isTwoFactorEnabled ? 'default' : 'secondary'} className="text-xs">
                    {user?.isTwoFactorEnabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Status
              </CardTitle>
              <CardDescription>
                Your account security overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Account Active</span>
                  </div>
                  <Badge variant="default" className="text-xs">Secure</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">2FA Status</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {user?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Last Login</span>
                  </div>
                  <span className="text-xs text-gray-600">Today</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
                <Button className="w-full" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  View Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
              <Button className="w-full" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Active Sessions
              </Button>
              <Button className="w-full" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Security Alerts
              </Button>
              {user?.role === 'ADMIN' && (
                <Button className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Data Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Test Data
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                >
                  {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardTitle>
              <CardDescription>
                Sensitive data for testing purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showSensitiveData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h4 className="font-medium mb-2">Access Token</h4>
                      <p className="text-xs font-mono break-all">
                        {localStorage.getItem('accessToken') || 'No token found'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h4 className="font-medium mb-2">Refresh Token</h4>
                      <p className="text-xs font-mono break-all">
                        {localStorage.getItem('refreshToken') || 'No token found'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-medium mb-2">Session Token</h4>
                    <p className="text-xs font-mono break-all">
                      {localStorage.getItem('sessionToken') || 'No session token found'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click the eye icon to view sensitive test data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
