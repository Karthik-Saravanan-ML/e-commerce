import { createSlice } from '@reduxjs/toolkit';
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false, searchOpen: false, theme: 'light' },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
    toggleSearch(state) { state.searchOpen = !state.searchOpen; },
    setTheme(state, action) { state.theme = action.payload; },
  },
});
export const { toggleSidebar, setSidebarOpen, toggleSearch, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
