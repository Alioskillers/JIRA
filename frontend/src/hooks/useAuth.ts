'use client';

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, accessToken, login, logout, refreshTokens } = useAuthStore();
  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee',
    login,
    logout,
    refreshTokens,
  };
}
