import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const getApi = () => import('../../utils/api').then(m => m.default);

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { const api = await getApi(); const { data } = await api.get('/cart'); return data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const addToCart = createAsyncThunk('cart/add', async ({ bookId, quantity = 1 }, { rejectWithValue }) => {
  try { const api = await getApi(); const { data } = await api.post('/cart/add', { bookId, quantity }); toast.success('Added to cart'); return data.cart; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const updateCartItem = createAsyncThunk('cart/update', async (payload, { rejectWithValue }) => {
  try { const api = await getApi(); const { data } = await api.put('/cart/update', payload); return data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (bookId, { rejectWithValue }) => {
  try { const api = await getApi(); const { data } = await api.delete(`/cart/remove/${bookId}`); return data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const toggleWishlist = createAsyncThunk('cart/toggleWishlist', async (bookId, { rejectWithValue }) => {
  try { const api = await getApi(); const { data } = await api.put(`/cart/wishlist/${bookId}`); return data.wishlist; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const toggleReadLater = createAsyncThunk('cart/toggleReadLater', async (bookId, { rejectWithValue }) => {
  try { const api = await getApi(); const { data } = await api.put(`/cart/read-later/${bookId}`); return data.readLater; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], loading: false, wishlist: [], readLater: [] },
  reducers: {
    setWishlist(state, action) { state.wishlist = action.payload; },
    setReadLater(state, action) { state.readLater = action.payload; },
    clearCartLocal(state) { state.items = []; },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => { state.loading = false; if (action.payload) state.items = action.payload.items || []; };
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, (state) => { state.loading = false; })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(toggleWishlist.fulfilled, (state, action) => { state.wishlist = action.payload || []; })
      .addCase(toggleReadLater.fulfilled, (state, action) => { state.readLater = action.payload || []; });
  },
});

export const { setWishlist, setReadLater, clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
