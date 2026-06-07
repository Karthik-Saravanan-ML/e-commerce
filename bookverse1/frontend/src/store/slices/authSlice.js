import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { getToken, setToken, removeToken } from '../../utils/authStorage';

const getApi = () => import('../../utils/api').then(m => m.default);

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.post('/auth/login', credentials);
    setToken(data.token);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.post('/auth/register', userData);
    setToken(data.token);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Registration failed'); }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    removeToken();
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.put('/auth/profile', profileData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: getToken(),
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      removeToken();
      toast.success('Logged out');
    },
    clearError(state) { state.error = null; },
    updateUser(state, action) { state.user = { ...state.user, ...action.payload }; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };
    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; toast.success('Welcome back!'); })
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; toast.success('Account created!'); })
      .addCase(register.rejected, rejected)
      .addCase(getMe.pending, (state) => { state.loading = true; })
      .addCase(getMe.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.initialized = true; })
      .addCase(getMe.rejected, (state) => { state.loading = false; state.user = null; state.token = null; state.initialized = true; })
      .addCase(updateProfile.fulfilled, (state, action) => { state.user = action.payload.user; toast.success('Profile updated'); });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
