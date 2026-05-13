'use client';

import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User } from '@/types';

const COOKIE_OPTIONS = {
  expires: 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

const KEYS = {
  user: 'mj_user',
  accessToken: 'mj_access',
  idToken: 'mj_id',
  refreshToken: 'mj_refresh',
};

function writeCookies(user: User, accessToken: string, idToken: string, refreshToken: string) {
  Cookies.set(KEYS.user, JSON.stringify(user), COOKIE_OPTIONS);
  Cookies.set(KEYS.accessToken, accessToken, COOKIE_OPTIONS);
  Cookies.set(KEYS.idToken, idToken, COOKIE_OPTIONS);
  Cookies.set(KEYS.refreshToken, refreshToken, COOKIE_OPTIONS);
}

function clearCookies() {
  Object.values(KEYS).forEach(key => Cookies.remove(key));
  localStorage.removeItem('mini-jira-auth');
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Always start empty — prevents SSR/client mismatch
  user: null,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  hydrated: false,

  // Called once on the client after mount to load cookies
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const userRaw = Cookies.get(KEYS.user);
      const user = userRaw ? (JSON.parse(userRaw) as User) : null;
      const accessToken = Cookies.get(KEYS.accessToken) ?? null;
      const idToken = Cookies.get(KEYS.idToken) ?? null;
      const refreshToken = Cookies.get(KEYS.refreshToken) ?? null;
      set({ user, accessToken, idToken, refreshToken, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  login: async (email: string, password: string) => {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await axios.post(`${baseURL}/auth/login`, { email, password });
    const { accessToken, refreshToken, idToken } = res.data;

    const decoded = jwtDecode<Record<string, string>>(idToken);
    const user: User = {
      userId: decoded.sub,
      email: decoded.email,
      name: decoded.name || email.split('@')[0],
      role: (decoded['custom:role'] as 'manager' | 'employee') || 'employee',
      teamId: decoded['custom:teamId'] || 'unassigned',
    };

    writeCookies(user, accessToken, idToken, refreshToken);
    set({ user, accessToken, idToken, refreshToken, hydrated: true });
  },

  logout: () => {
    clearCookies();
    set({ user: null, accessToken: null, idToken: null, refreshToken: null });
  },

  refreshTokens: async () => {
    const { refreshToken } = get();
    if (!refreshToken) throw new Error('No refresh token');

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const { accessToken, idToken } = res.data;

    const decoded = jwtDecode<Record<string, string>>(idToken);
    const currentUser = get().user;
    const updatedUser: User = {
      ...(currentUser as User),
      role: ((decoded['custom:role'] || currentUser?.role || 'employee') as 'manager' | 'employee'),
      teamId: decoded['custom:teamId'] || currentUser?.teamId || 'unassigned',
    };

    Cookies.set(KEYS.accessToken, accessToken, COOKIE_OPTIONS);
    Cookies.set(KEYS.idToken, idToken, COOKIE_OPTIONS);
    Cookies.set(KEYS.user, JSON.stringify(updatedUser), COOKIE_OPTIONS);

    set({ accessToken, idToken, user: updatedUser });
  },
}));
