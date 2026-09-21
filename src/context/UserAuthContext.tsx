import React, { createContext, useContext, useState, useEffect } from 'react';
import { RegisteredUser } from '../types';

interface UserAuthContextType {
  currentUser: RegisteredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'register' | 'verify';
  verificationEmail: string;
  openAuthModal: (mode?: 'signin' | 'register' | 'verify', emailForVerification?: string) => void;
  closeAuthModal: () => void;
  registerUser: (params: { email: string; password: string; confirmPassword?: string; name?: string }) => Promise<{
    success: boolean;
    emailSent?: boolean;
    requiresVerification?: boolean;
    email?: string;
    message?: string;
    error?: string;
  }>;
  verifyCode: (email: string, code: string) => Promise<{
    success: boolean;
    verified?: boolean;
    user?: RegisteredUser;
    error?: string;
    remainingAttempts?: number;
    expired?: boolean;
  }>;
  resendVerificationCode: (email: string) => Promise<{
    success: boolean;
    emailSent?: boolean;
    error?: string;
    cooldown?: boolean;
    remainingSeconds?: number;
    message?: string;
  }>;
  loginUser: (params: { email: string; password: string }) => Promise<{
    success: boolean;
    user?: RegisteredUser;
    requiresVerification?: boolean;
    email?: string;
    error?: string;
  }>;
  loginWithGoogle: (googleData: {
    idToken?: string;
    credential?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => Promise<{
    success: boolean;
    user?: RegisteredUser;
    error?: string;
  }>;
  logoutUser: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register' | 'verify'>('signin');
  const [verificationEmail, setVerificationEmail] = useState<string>('');

  const checkSession = async () => {
    try {
      const savedToken = localStorage.getItem('shendam_user_token');
      const res = await fetch('/api/auth/me', {
        headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch {
      // Offline or server not ready
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const openAuthModal = (mode: 'signin' | 'register' | 'verify' = 'signin', emailForVerification = '') => {
    setAuthModalMode(mode);
    if (emailForVerification) {
      setVerificationEmail(emailForVerification);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const registerUser = async (params: { email: string; password: string; confirmPassword?: string; name?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();

      if (data.success) {
        setVerificationEmail(params.email);
        setAuthModalMode('verify');
        return data;
      } else {
        return { success: false, error: data.error || 'Registration failed.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration.' };
    }
  };

  const verifyCode = async (email: string, code: string) => {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.token) {
          localStorage.setItem('shendam_user_token', data.token);
        }
        setIsAuthModalOpen(false);
        return { success: true, verified: true, user: data.user };
      } else {
        return {
          success: false,
          error: data.error || 'Verification failed.',
          remainingAttempts: data.remainingAttempts,
          expired: data.expired
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying code.' };
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error resending code.' };
    }
  };

  const loginUser = async (params: { email: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.token) {
          localStorage.setItem('shendam_user_token', data.token);
        }
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else if (data.requiresVerification) {
        setVerificationEmail(params.email);
        setAuthModalMode('verify');
        return {
          success: false,
          requiresVerification: true,
          email: params.email,
          error: data.message || 'Please verify your email address.'
        };
      } else {
        return { success: false, error: data.error || 'Invalid credentials.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during sign in.' };
    }
  };

  const loginWithGoogle = async (googleData: {
    idToken?: string;
    credential?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => {
    try {
      const payload = {
        idToken: googleData.idToken || googleData.credential,
        credential: googleData.credential || googleData.idToken
      };
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.token) {
          localStorage.setItem('shendam_user_token', data.token);
        }
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Google sign-in failed.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during Google sign-in.' };
    }
  };

  const logoutUser = async () => {
    try {
      const savedToken = localStorage.getItem('shendam_user_token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {}
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('shendam_user_token');
      setCurrentUser(null);
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        verificationEmail,
        openAuthModal,
        closeAuthModal,
        registerUser,
        verifyCode,
        resendVerificationCode,
        loginUser,
        loginWithGoogle,
        logoutUser,
        checkSession
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
