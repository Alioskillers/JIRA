'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import { Team, User } from '@/types';

interface TeamStore {
  teams: Team[];
  users: User[];
  fetchTeams: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  users: [],

  fetchTeams: async () => {
    const res = await api.get('/teams');
    set({ teams: res.data });
  },

  fetchUsers: async () => {
    const res = await api.get('/users');
    set({ users: res.data });
  },
}));
