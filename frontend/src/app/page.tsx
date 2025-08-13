'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Shield, 
  Settings, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Mail,
  Lock,
  Smartphone,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
//import { profileApi } from '@/lib/api/profile';
//import { sessionsApi } from '@/lib/api/sessions';
//import { adminApi } from '@/lib/api/admin';
import { SignupRequest, LoginRequest } from '@/types/api';

export default function TestUI() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    signup: {
      firstname: 'John',
      lastname: 'Doe',
      username: 'johndoe',
      email: 'test@example.com',
      password: 'Password123!',
      preferredLanguage: 'en',
      timezone: 'UTC'
    } as SignupRequest,
    login: {
      email: 'test@example.com',
      password: 'Password123!',
      rememberMe: false
    } as LoginRequest
  });

  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError,
    handleLogin,
    handleSignup,
    handleLogout,
    clearError
  } = useAuth();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsLoading(true);
    clearError();
    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result, timestamp: new Date().toISOString() }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const TestResult = ({ testName }: { testName: string }) => {
    const result = testResults[testName];
    if (!result) return null;

    return (
      <div className={`p-3 rounded-md border ${
        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {testName}
          </span>
        </div>
        <div className="text-sm">
          {result.success ? (
            <pre className="text-green-700 bg-green-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          ) : (
            <div className="text-red-700">{result.error}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {new Date(result.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  const sections = [
    {
      id: 'auth',
      title: 'Authentication',
      description: 'User registration, login, and authentication flows',
      icon: User,
      color: 'bg-blue-500',
      tests: ['signup', 'login', 'logout', 'setup-2fa', 'enable-2fa', 'verify-2fa']
    },
    {
      id: 'profile',
      title: 'Profile Management',
      description: 'Profile retrieval and update functionality',
      icon: Settings,
      color: 'bg-green-500',
      tests: ['get-profile', 'update-profile']
    },
    {
      id: 'sessions',
      title: 'Session Management',
      description: 'Session listing and management functionality',
      icon: Activity,
      color: 'bg-purple-500',
      tests: ['get-sessions', 'terminate-session']
    },
    {
      id: 'admin',
      title: 'Admin Functions',
      description: 'Admin user management functionality',
      icon: Shield,
      color: 'bg-orange-500',
      tests: ['get-users', 'get-audit-logs', 'get-suspicious-activities']
    },
    {
      id: 'security',
      title: 'Security Monitoring',
      description: 'Suspicious activity detection and management',
      icon: AlertTriangle,
      color: 'bg-red-500',
      tests: ['get-suspicious-activities', 'security-stats']
    }
  ];

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'auth':
  return (
          <div className="space-y-6">
            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
                    </div>
                    {user && (
                      <div className="text-sm text-gray-600">
                        <div>User: {user.firstname} {user.lastname}</div>
                        <div>Email: {user.email}</div>
                        <div>Role: {user.role}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${authLoading ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                      <span className="font-medium">Loading: {authLoading ? 'Yes' : 'No'}</span>
                    </div>
                    {authError && (
                      <div className="text-sm text-red-600">
                        Error: {authError}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Signup Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Signup Test
                  </CardTitle>
                  <CardDescription>
                    Test user registration with real backend
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={formData.signup.firstname}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        signup: { ...prev.signup, firstname: e.target.value }
                      }))}
                      className="p-2 border rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={formData.signup.lastname}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        signup: { ...prev.signup, lastname: e.target.value }
                      }))}
                      className="p-2 border rounded text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.signup.username}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signup: { ...prev.signup, username: e.target.value }
                    }))}
                    className="p-2 border rounded text-sm w-full"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.signup.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signup: { ...prev.signup, email: e.target.value }
                    }))}
                    className="p-2 border rounded text-sm w-full"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.signup.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signup: { ...prev.signup, password: e.target.value }
                    }))}
                    className="p-2 border rounded text-sm w-full"
                  />
                  <Button 
                    onClick={() => runTest('signup', async () => {
                      return await handleSignup(formData.signup);
                    })}
                    disabled={isLoading || authLoading}
                    className="w-full"
                  >
                    Test Signup
                  </Button>
                </CardContent>
              </Card>

              {/* Login Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Login Test
                  </CardTitle>
                  <CardDescription>
                    Test user authentication with real backend
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.login.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      login: { ...prev.login, email: e.target.value }
                    }))}
                    className="p-2 border rounded text-sm w-full"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.login.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      login: { ...prev.login, password: e.target.value }
                    }))}
                    className="p-2 border rounded text-sm w-full"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={formData.login.rememberMe}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        login: { ...prev.login, rememberMe: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="rememberMe" className="text-sm">Remember me</label>
                  </div>
                  <Button 
                    onClick={() => runTest('login', async () => {
                      return await handleLogin(formData.login.email, formData.login.password, formData.login.rememberMe);
                    })}
                    disabled={isLoading || authLoading}
                    className="w-full"
                  >
                    Test Login
                  </Button>
                </CardContent>
              </Card>
        </div>

            {/* 2FA and Logout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => runTest('setup-2fa', async () => {
                  return await authApi.setup2fa();
                })}
                disabled={isLoading || !isAuthenticated}
                variant="outline"
                className="w-full"
              >
                Setup 2FA
              </Button>

              <Button 
                onClick={() => runTest('enable-2fa', async () => {
                  return await authApi.enable2fa({ code: '123456' });
                })}
                disabled={isLoading || !isAuthenticated}
                variant="outline"
                className="w-full"
              >
                Enable 2FA
              </Button>

              <Button 
                onClick={() => runTest('logout', async () => {
                  await handleLogout();
                  return { message: 'Logged out successfully' };
                })}
                disabled={isLoading || !isAuthenticated}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        );

      // case 'profile':
      //   return (
      //     <div className="space-y-6">
      //       <Card>
      //         <CardHeader>
      //           <CardTitle className="flex items-center gap-2">
      //             <Settings className="h-5 w-5" />
      //             Profile Management
      //           </CardTitle>
      //           <CardDescription>
      //             Test profile retrieval and update functionality
      //           </CardDescription>
      //         </CardHeader>
      //         <CardContent className="space-y-4">
      //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      //             <Button 
      //               onClick={() => runTest('get-profile', async () => {
      //                 return await profileApi.getProfile();
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               className="w-full"
      //             >
      //               Get Profile
      //             </Button>

      //             <Button 
      //               onClick={() => runTest('update-profile', async () => {
      //                 return await profileApi.updateProfile({
      //                   displayName: 'Updated Test User',
      //                   bio: 'Updated bio for testing'
      //                 });
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               variant="outline"
      //               className="w-full"
      //             >
      //               Update Profile
      //             </Button>
      //           </div>
      //         </CardContent>
      //       </Card>
      //     </div>
      //   );

      // case 'sessions':
      //   return (
      //     <div className="space-y-6">
      //       <Card>
      //         <CardHeader>
      //           <CardTitle className="flex items-center gap-2">
      //             <Activity className="h-5 w-5" />
      //             Session Management
      //           </CardTitle>
      //           <CardDescription>
      //             Test session listing and management functionality
      //           </CardDescription>
      //         </CardHeader>
      //         <CardContent className="space-y-4">
      //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      //             <Button 
      //               onClick={() => runTest('get-sessions', async () => {
      //                 return await sessionsApi.getSessions();
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               className="w-full"
      //             >
      //               Get Sessions
      //             </Button>

      //             <Button 
      //               onClick={() => runTest('terminate-session', async () => {
      //                 return await sessionsApi.terminateSession('session-token-123');
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               variant="outline"
      //               className="w-full"
      //             >
      //               Terminate Session
      //             </Button>
      //           </div>
      //         </CardContent>
      //       </Card>
      //     </div>
      //   );

      // case 'admin':
      //   return (
      //     <div className="space-y-6">
      //       <Card>
      //         <CardHeader>
      //           <CardTitle className="flex items-center gap-2">
      //             <Shield className="h-5 w-5" />
      //             Admin Functions
      //           </CardTitle>
      //           <CardDescription>
      //             Test admin user management functionality
      //           </CardDescription>
      //         </CardHeader>
      //         <CardContent className="space-y-4">
      //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      //             <Button 
      //               onClick={() => runTest('get-users', async () => {
      //                 return await adminApi.getUsers();
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               className="w-full"
      //             >
      //               Get All Users
      //             </Button>

      //             <Button 
      //               onClick={() => runTest('get-audit-logs', async () => {
      //                 return await adminApi.getAuditLogs();
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               variant="outline"
      //               className="w-full"
      //             >
      //               Get Audit Logs
      //             </Button>

      //             <Button 
      //               onClick={() => runTest('get-suspicious-activities', async () => {
      //                 return await adminApi.getSuspiciousActivities();
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               variant="outline"
      //               className="w-full"
      //             >
      //               Get Suspicious Activities
      //             </Button>
      //           </div>
      //         </CardContent>
      //       </Card>
      //     </div>
      //   );

      // case 'security':
      //   return (
      //     <div className="space-y-6">
      //       <Card>
      //         <CardHeader>
      //           <CardTitle className="flex items-center gap-2">
      //             <AlertTriangle className="h-5 w-5" />
      //             Security Monitoring
      //           </CardTitle>
      //           <CardDescription>
      //             Test suspicious activity detection and management
      //           </CardDescription>
      //         </CardHeader>
      //         <CardContent className="space-y-4">
      //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      //             <Button 
      //               onClick={() => runTest('get-suspicious-activities', async () => {
      //                 return await adminApi.getSuspiciousActivities();
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               className="w-full"
      //             >
      //               Get Suspicious Activities
      //             </Button>

      //             <Button 
      //               onClick={() => runTest('security-stats', async () => {
      //                 // Mock security stats since there's no specific API for this
      //                 return {
      //                   totalThreats: 15,
      //                   highSeverity: 3,
      //                   mediumSeverity: 8,
      //                   lowSeverity: 4,
      //                   resolvedThreats: 12
      //                 };
      //               })}
      //               disabled={isLoading || !isAuthenticated}
      //               variant="outline"
      //               className="w-full"
      //             >
      //               Get Security Stats
      //             </Button>
      //           </div>
      //         </CardContent>
      //       </Card>
      //     </div>
      //   );

      default:
        return null;
    }
  };

  if (activeSection) {
    const section = sections.find(s => s.id === activeSection);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with back button */}
          <div className="mb-8">
            <Button
              onClick={() => setActiveSection(null)}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{section?.title}</h1>
            <p className="text-gray-600">{section?.description}</p>
          </div>

          {/* Section Content */}
          {renderSectionContent(activeSection)}

          {/* Test Results */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{section?.title} Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(testResults).filter(key => 
                section?.tests.includes(key)
              ).map(testName => (
                <TestResult key={testName} testName={testName} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vision TF - Test UI</h1>
          <p className="text-gray-600">Comprehensive testing interface for all functionality</p>
        </div>

        {/* Authentication Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">Status</span>
                </div>
                <div className="text-sm text-gray-600">
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${authLoading ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                  <span className="font-medium">Loading</span>
                </div>
                <div className="text-sm text-gray-600">
                  {authLoading ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${authError ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                  <span className="font-medium">Error</span>
                </div>
                <div className="text-sm text-gray-600">
                  {authError || 'None'}
                </div>
              </div>
            </div>
            {user && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">Current User</h4>
                <div className="text-sm text-gray-600">
                  <div>Name: {user.firstname} {user.lastname}</div>
                  <div>Email: {user.email}</div>
                  <div>Role: {user.role}</div>
                  <div>Email Verified: {user.isEmailVerified ? 'Yes' : 'No'}</div>
                  <div>2FA Enabled: {user.isTwoFactorEnabled ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card 
                key={section.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => setActiveSection(section.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${section.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {section.tests.length} test functions
                    </span>
                    <div className="text-sm text-gray-400">
                      Click to explore →
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Test Results Overview */}
        {Object.keys(testResults).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Overview of all test results across all sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(testResults).slice(-6).map(([testName, result]) => (
                  <div key={testName} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{testName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
