'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useForgotPassword';

export default function ForgotPasswordForm() {
  const { handleForgotPassword, isLoading, error, success, clearError, redirectToLogin } = useForgotPassword();
  const [email, setEmail] = useState('');

  const handleInputChange = (value: string) => {
    setEmail(value);
    // Clear errors when user starts typing
    if (error) clearError();
  };

  const validateForm = () => {
    if (!email) {
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await handleForgotPassword(email);
    } catch (err: any) {
      console.error('Forgot password error:', err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-gray-600 hover:text-gray-800"
              onClick={redirectToLogin}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
            
            <div className="text-sm text-gray-600">
              Remember your password?{' '}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Sign in
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
