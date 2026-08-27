import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { AccessibilityProfile } from '../../types/accessibility';

const SESSION_TOKEN_KEY = 'token';
const SESSION_USER_KEY = 'huruspaces-user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  accessibilityProfile: AccessibilityProfile;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const getStoredUser = (): User | null => {
  const rawUser = localStorage.getItem(SESSION_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
};

const persistSession = (token: string, user: User) => {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
};

const getAuthHeaders = (token: string | null) => ({
  Authorization: `Bearer ${token}`,
});

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Request failed';
  }

  return 'Request failed';
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem(SESSION_TOKEN_KEY),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      persistSession(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    {
      name,
      email,
      password,
      accessibilityProfile,
    }: {
      name: string;
      email: string;
      password: string;
      accessibilityProfile: AccessibilityProfile;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        accessibilityProfile,
      });
      persistSession(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };

    if (!state.auth.token) {
      return rejectWithValue('No session found');
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: getAuthHeaders(state.auth.token),
      });
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(response.data.user));
      return response.data.user as User;
    } catch (error) {
      clearSession();
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    {
      name,
      accessibilityProfile,
    }: {
      name: string;
      accessibilityProfile: AccessibilityProfile;
    },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { auth: AuthState };

    try {
      const response = await axios.put(
        `${API_URL}/users/profile`,
        { name, accessibilityProfile },
        { headers: getAuthHeaders(state.auth.token) }
      );
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(response.data.user));
      return response.data.user as User;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      clearSession();
      state.user = null;
      state.token = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Registration failed';
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.error = (action.payload as string) || 'Unable to restore session';
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Unable to update profile';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
