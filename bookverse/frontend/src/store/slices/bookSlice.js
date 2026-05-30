import { createSlice } from '@reduxjs/toolkit';
const bookSlice = createSlice({
  name: 'books',
  initialState: { list: [], current: null, loading: false, total: 0, pages: 0, currentPage: 1, filters: {} },
  reducers: {
    setFilters(state, action) { state.filters = { ...state.filters, ...action.payload }; },
    clearFilters(state) { state.filters = {}; },
    setCurrentBook(state, action) { state.current = action.payload; },
  },
});
export const { setFilters, clearFilters, setCurrentBook } = bookSlice.actions;
export default bookSlice.reducer;
