import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMetricsAPI, trackEventAPI, deleteMetricsAPI } from '../api';

export const fetchMetrics = createAsyncThunk('metrics/fetch', async (key) => {
  const res = await getMetricsAPI(key);
  return res.data;
});

export const trackEvent = createAsyncThunk('metrics/add', async (data) => {
  const res = await trackEventAPI(data);
  return res.data;
});

export const deleteMetrics = createAsyncThunk('metrics/delete', async (key) => {
  await deleteMetricsAPI(key);
  return key;
});

const metricsSlice = createSlice({
  name: 'metrics',
  initialState: {
    data: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Metrics
      .addCase(fetchMetrics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(trackEvent.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(deleteMetrics.fulfilled, (state, action) => {
        state.data = null;
        state.status = 'succeeded';
      })
  },
});

export default metricsSlice.reducer;
