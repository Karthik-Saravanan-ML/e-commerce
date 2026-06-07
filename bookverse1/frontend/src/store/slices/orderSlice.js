import { createSlice } from '@reduxjs/toolkit';
const orderSlice = createSlice({
  name: 'orders',
  initialState: { list: [], current: null, loading: false, total: 0 },
  reducers: {
    setOrders(state, action) { state.list = action.payload.orders; state.total = action.payload.total; },
    setCurrentOrder(state, action) { state.current = action.payload; },
    clearCurrentOrder(state) { state.current = null; },
  },
});
export const { setOrders, setCurrentOrder, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
