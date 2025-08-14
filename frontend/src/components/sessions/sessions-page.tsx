'use client';

import { useSessions } from '@/hooks/useSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Monitor, Smartphone, Globe, Clock, Trash2, CheckCircle, Loader2 } from 'lucide-react';

export default function SessionsPage() {
  const {
    sessions,
    isLoading,
    error,
    success,
    fetchUserSessions,
    terminateSpecificSession,
    terminateAllSessions,
    clearError,
    clearSuccess,
  } = useSessions();

  const handleTerminateSession = async (sessionToken: string) => {
    await terminateSpecificSession(sessionToken);
  };

  const handleTerminateAllSessions = async () => {
    if (window.confirm('Terminate all other sessions?')) {
      await terminateAllSessions();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Management</h1>
        
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-red-800">{error}</span>
                <Button variant="ghost" size="sm" onClick={clearError}>Dismiss</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-green-800">{success}</span>
                <Button variant="ghost" size="sm" onClick={clearSuccess}>Dismiss</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mb-6">
          <Button onClick={fetchUserSessions} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
            Refresh Sessions
          </Button>
          
          {sessions.filter(s => !s.isCurrentSession).length > 0 && (
            <Button onClick={handleTerminateAllSessions} disabled={isLoading} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Terminate All Other Sessions
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.sessionToken}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                      {session.userAgent.toLowerCase().includes('mobile') ? (
                        <Smartphone className="h-6 w-6" />
                      ) : (
                        <Monitor className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Browser Session</h3>
                        {session.isCurrentSession && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Current
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>{session.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Last active: {session.formattedLastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrentSession && (
                    <Button
                      onClick={() => handleTerminateSession(session.sessionToken)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Terminate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 