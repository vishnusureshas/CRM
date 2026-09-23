import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type AuthState = {
  accessToken: string | null;
  user: any | null;
  organization: any | null;
};

// Hydrate from localStorage so refresh doesn't wipe in-memory token
const loadPersisted = (): Partial<AuthState> => {
  try {
    const raw = localStorage.getItem('crm_auth');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const persisted = loadPersisted();

const initialState: AuthState = {
  accessToken: (persisted.accessToken as string) || null,
  user: (persisted.user as any) || null,
  organization: (persisted.organization as any) || null,
};

const persist = (state: AuthState) => {
  try {
    localStorage.setItem('crm_auth', JSON.stringify({ accessToken: state.accessToken, user: state.user, organization: state.organization }));
  } catch {}
};
const clearPersist = () => {
  try { localStorage.removeItem('crm_auth'); } catch {}
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; user?: any; organization?: any }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) state.user = action.payload.user;
      if (action.payload.organization) state.organization = action.payload.organization;
      persist(state);
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.organization = null;
      clearPersist();
    },
  },
});

export const { setCredentials, logout } = slice.actions;
export default slice.reducer;
export const selectIsAuthenticated = (s: { auth: AuthState }) => !!s.auth.accessToken;
export const selectCurrentUser = (s: { auth: AuthState }) => s.auth.user;
