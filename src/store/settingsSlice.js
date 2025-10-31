import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSettingsAPI, updateSettingsAPI } from '../api';

export const fetchSettings = createAsyncThunk('settings/fetch', async (key) => {
  const res = await getSettingsAPI(key);
  return res.data;
});

export const saveSettings = createAsyncThunk('settings/update', async ({ key, data }) => {
  const res = await updateSettingsAPI(key, data);
  return res.data;
});

// -------------------- Slice --------------------
const settingsSlice = createSlice({
  name: 'settings',
  initialState: { data: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => { 
        state.status = 'loading';
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export default settingsSlice.reducer;
