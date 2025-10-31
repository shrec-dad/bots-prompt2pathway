import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getBotsAPI,
  createBotAPI,
  updateBotAPI,
  deleteBotAPI,
  duplicateBotAPI,
} from '../api';

// Thunks
export const fetchBots = createAsyncThunk('bots/fetchAll', async () => {
  const res = await getBotsAPI();
  return res.data;
});

export const addBot = createAsyncThunk('bots/add', async (data) => {
  const res = await createBotAPI(data);
  return res.data;
});

export const updateBot = createAsyncThunk('bots/update', async ({ id, data }) => {
  const res = await updateBotAPI(id, data);
  return res.data;
});

export const deleteBot = createAsyncThunk('bots/delete', async (id) => {
  await deleteBotAPI(id);
  return id;
});

export const duplicateBot = createAsyncThunk('bots/duplicate', async ({id, data}) => {
  const res = await duplicateBotAPI(id, data);
  return res.data;
});

const botsSlice = createSlice({
  name: 'bots',
  initialState: { list: [], selected: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBots.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = 'succeeded';
      })
      .addCase(addBot.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addBot.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateBot.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateBot.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a._id === action.payload._id);
        if (idx > -1) state.list[idx] = action.payload;
      })
      .addCase(deleteBot.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a._id !== action.payload);
      })
      .addCase(duplicateBot.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export default botsSlice.reducer;
