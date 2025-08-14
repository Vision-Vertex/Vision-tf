// Authentication Logic - Day 1 Afternoon Hour 1-2 (2 hours)

// 1.1 Login Flow Implementation (45 min)
// - validateLoginForm(email, password)
// - handleLogin(email, password, rememberMe)
// - handleLoginSuccess(response)
// - handleLoginError(error)
// - handle2faRequired(response)
// - handleAccountLocked(error)
// - handleInvalidCredentials(error)
// - handleNetworkError(error)
// - handleServerError(error)
// - redirectToDashboard()
// - redirectTo2fa()
// - showErrorToast(message)
// - showSuccessToast(message)

// 1.2 Signup Flow Implementation (45 min)
// - validateSignupForm(data)
// - validatePasswordStrength(password)
// - validateEmailFormat(email)
// - validateUsernameFormat(username)
// - handleSignup(userData)
// - handleSignupSuccess(response)
// - handleSignupError(error)
// - handleEmailAlreadyExists(error)
// - handleUsernameAlreadyExists(error)
// - handleValidationError(error)
// - redirectToEmailVerification()
// - showVerificationEmailSent()

// 1.3 Token Management Implementation (30 min)
// - setupTokenRefresh()
// - handleTokenExpiration()
// - refreshAccessToken()
// - handleRefreshError(error)
// - setupAutoLogout()
// - handleSessionExpiration()
// - clearExpiredTokens()
// - validateTokenFormat(token)
// Authentication Logic - Day 1 Afternoon Hour 1-2 (2 hours)
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { authApi } from '../lib/api/auth';
import { LoginRequest, SignupRequest, Verify2faRequest, SignupResponse } from '../types/api';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginStore,
    signup: signupStore,
    logout: logoutStore,
    refreshTokens: refreshTokenStore,
    clearError,
    setLoading,
    setError,
  } = useAuthStore();

  const [is2faRequired, setIs2faRequired] = useState(false);
  const [tempAuthData, setTempAuthData] = useState<any>(null);

  // 1.1 Login Flow Implementation (45 min)
  const validateLoginForm = useCallback((email: string, password: string): boolean => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  }, [setError]);

  const handleLogin = useCallback(async (email: string, password: string, rememberMe = false) => {
    if (!validateLoginForm(email, password)) return;
  
    setLoading(true);
    clearError();
  
    try {
      const loginData: LoginRequest = { email, password, rememberMe };
      const response = await authApi.login(loginData);

      if (response.accessToken && response.refreshToken) {
        const sessionToken = response.sessionToken || '';
        const user = response.user || undefined;
        loginStore(response.accessToken, response.refreshToken, sessionToken, rememberMe, user);
        handleLoginSuccess(response);
      } else {
        handleLoginError(new Error('Invalid response from server'));
      }
    } catch (error: any) {
        handleLoginError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [validateLoginForm, setLoading, clearError, loginStore]);
  

  const handleLoginSuccess = useCallback((response: any) => {
    showSuccessToast('Login successful');
    redirectToDashboard();
  }, []);

  const handleLoginError = useCallback((error: Error) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('2fa') || errorMessage.includes('two-factor')) {
      handle2faRequired({ requires2fa: true, tempToken: 'temp' });
    } else if (errorMessage.includes('locked') || errorMessage.includes('suspended')) {
      handleAccountLocked(error);
    } else if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
      handleInvalidCredentials(error);
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      handleNetworkError(error);
    } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      handleServerError(error);
    } else {
      setError(error.message || 'Login failed');
    }
  }, [setError]);

  const handle2faRequired = useCallback((response: any) => {
    setIs2faRequired(true);
    setTempAuthData(response);
    redirectTo2fa();
  }, []);

  const handleAccountLocked = useCallback((error: Error) => {
    setError('Account is locked. Please contact support.');
  }, [setError]);

  const handleInvalidCredentials = useCallback((error: Error) => {
    setError('Invalid email or password');
  }, [setError]);

  const handleNetworkError = useCallback((error: Error) => {
    setError('Network error. Please check your connection.');
  }, [setError]);

  const handleServerError = useCallback((error: Error) => {
    setError('Server error. Please try again later.');
  }, [setError]);

  const redirectToDashboard = useCallback(() => {
    router.push('/');
  }, [router]);

  const redirectTo2fa = useCallback(() => {
    router.push('/2fa');
  }, [router]);

  const showErrorToast = useCallback((message: string) => {
    console.error(message);
    setError(message);
  }, [setError]);

  const showSuccessToast = useCallback((message: string) => {
    console.log(message);
  }, []);

  // 1.2 Signup Flow Implementation (45 min)
  const validateSignupForm = useCallback((data: SignupRequest): boolean => {
    if (!data.firstname || !data.lastname || !data.username || !data.email || !data.password) {
      setError('All fields are required');
      return false;
    }
    
    if (!validateEmailFormat(data.email)) {
      return false;
    }
    
    if (!validateUsernameFormat(data.username)) {
      return false;
    }
    
    if (!validatePasswordStrength(data.password)) {
      return false;
    }
    
    return true;
  }, [setError]);

  const validatePasswordStrength = useCallback((password: string): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    
    if (!/(?=.*\d)/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    
    return true;
  }, [setError]);

  const validateEmailFormat = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  }, [setError]);

  const validateUsernameFormat = useCallback((username: string): boolean => {
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    return true;
  }, [setError]);

  const handleSignup = useCallback(async (userData: SignupRequest) => {
    if (!validateSignupForm(userData)) {
      return;
    }

    setLoading(true);
    clearError();

    try {
      const response = await authApi.signup(userData);
      handleSignupSuccess(response);
    } catch (error) {
      handleSignupError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [validateSignupForm, setLoading, clearError]);

  const handleSignupSuccess = useCallback((response: SignupResponse) => {
    if (response.success && response.data) {
      // Store signup data but keep user unauthenticated until email verification
      // User will need to verify email and then login to become authenticated
      signupStore(response.data);
      redirectToEmailVerification();
      showVerificationEmailSent();
    } else {
      setError('Invalid response from server');
    }
  }, [signupStore, setError]);

  const handleSignupError = useCallback((error: Error) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('email') && errorMessage.includes('exists')) {
      handleEmailAlreadyExists(error);
    } else if (errorMessage.includes('username') && errorMessage.includes('exists')) {
      handleUsernameAlreadyExists(error);
    } else if (errorMessage.includes('validation')) {
      handleValidationError(error);
    } else {
      setError(error.message || 'Signup failed');
    }
  }, [setError]);

  const handleEmailAlreadyExists = useCallback((error: Error) => {
    setError('Email already exists. Please use a different email or try logging in.');
  }, [setError]);

  const handleUsernameAlreadyExists = useCallback((error: Error) => {
    setError('Username already exists. Please choose a different username.');
  }, [setError]);

  const handleValidationError = useCallback((error: Error) => {
    setError(error.message || 'Validation error');
  }, [setError]);

  const redirectToEmailVerification = useCallback(() => {
    router.push('/verify-email');
  }, [router]);

  const showVerificationEmailSent = useCallback(() => {
    showSuccessToast('Verification email sent. Please check your inbox.');
  }, [showSuccessToast]);

  // 1.3 Token Management Implementation (30 min)
  const setupTokenRefresh = useCallback(() => {
    // Get current state to determine refresh interval
    const { refreshToken, rememberMe } = useAuthStore.getState();
    
    if (!refreshToken) return () => {};

    // Use different refresh intervals based on remember me
    const refreshIntervalMs = rememberMe 
      ? 6 * 60 * 60 * 1000  // 6 hours for remember me (since backend tokens expire in 7 days)
      : 14 * 60 * 1000;     // 14 minutes for regular sessions

    // Set up automatic token refresh
    const refreshInterval = setInterval(async () => {
      const currentState = useAuthStore.getState();
      if (currentState.refreshToken) {
        try {
          const response = await authApi.refreshToken({ refreshToken: currentState.refreshToken });
          refreshTokenStore(response.accessToken, response.refreshToken);
        } catch (error) {
          handleRefreshError(error as Error);
        }
      }
    }, refreshIntervalMs);

    return () => clearInterval(refreshInterval);
  }, [refreshTokenStore]);

  const handleTokenExpiration = useCallback(() => {
    logoutStore();
    router.push('/login');
    showErrorToast('Session expired. Please login again.');
  }, [logoutStore, router, showErrorToast]);

  const refreshAccessToken = useCallback(async () => {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      handleTokenExpiration();
      return;
    }

    try {
      const response = await authApi.refreshToken({ refreshToken });
      refreshTokenStore(response.accessToken, response.refreshToken);
    } catch (error) {
      handleRefreshError(error as Error);
    }
  }, [refreshTokenStore, handleTokenExpiration]);

  const handleRefreshError = useCallback((error: Error) => {
    console.error('Token refresh failed:', error);
    handleTokenExpiration();
  }, [handleTokenExpiration]);

  const setupAutoLogout = useCallback(() => {
    // Get current state to check if remember me is enabled
    const { rememberMe } = useAuthStore.getState();
    
    // Disable auto logout for remember me sessions
    if (rememberMe) {
      return () => {}; // Return empty cleanup function
    }

    // Set up auto logout after inactivity only for regular sessions
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleSessionExpiration();
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, []);

  const handleSessionExpiration = useCallback(() => {
    logoutStore();
    router.push('/login');
    showErrorToast('Session expired due to inactivity.');
  }, [logoutStore, router, showErrorToast]);

  const clearExpiredTokens = useCallback(() => {
    // Tokens are managed by the Zustand store, so we just call logout
    logoutStore();
  }, [logoutStore]);

  const validateTokenFormat = useCallback((token: string): boolean => {
    return Boolean(token && token.length > 0);
  }, []);

  // 2FA verification
  const handle2faVerification = useCallback(async (code: string) => {
    if (!tempAuthData) {
      setError('No pending authentication found');
      return;
    }

    setLoading(true);
    clearError();

    try {
      const verifyData: Verify2faRequest = { code };
      const response = await authApi.verify2fa(verifyData);
      
      if (response.accessToken && response.refreshToken) {
        const sessionToken = response.sessionToken || '';
        const user = response.user || undefined;
        // For 2FA verification, we don't pass rememberMe - use default behavior
        loginStore(response.accessToken, response.refreshToken, sessionToken, false, user);
        setIs2faRequired(false);
        setTempAuthData(null);
        redirectToDashboard();
        showSuccessToast('2FA verification successful');
      }
    } catch (error) {
      setError('Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  }, [tempAuthData, setLoading, clearError, loginStore, setError, showSuccessToast]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      router.push('/login');
    }
  }, [logoutStore, router]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    is2faRequired,
    
    // Login
    handleLogin,
    validateLoginForm,
    
    // Signup
    handleSignup,
    validateSignupForm,
    
    // 2FA
    handle2faVerification,
    
    // Token management
    setupTokenRefresh,
    refreshAccessToken,
    setupAutoLogout,
    clearExpiredTokens,
    validateTokenFormat,
    
    // Logout
    handleLogout,
    
    // Utilities
    clearError,
    showErrorToast,
    showSuccessToast,
  };
};

