import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getInstancesAPI,
  createInstanceAPI,
  updateInstanceAPI,
  deleteInstanceAPI
} from '../api';

// Thunks
export const fetchInstances = createAsyncThunk('instances/fetchAll', async () => {
  const res = await getInstancesAPI();
  return res.data;
});

export const addInstance = createAsyncThunk('instances/add', async (data) => {
  const res = await createInstanceAPI(data);
  return res.data;
});

export const updateInstance = createAsyncThunk('instances/update', async ({ id, data }) => {
  const res = await updateInstanceAPI(id, data);
  return res.data;
});

export const deleteInstance = createAsyncThunk('instances/delete', async (id) => {
  await deleteInstanceAPI(id);
  return id;
});

const instancesSlice = createSlice({
  name: 'instances',
  initialState: { list: [], selected: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstances.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = 'succeeded';
      })
      .addCase(addInstance.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addInstance.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateInstance.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateInstance.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a._id === action.payload._id);
        if (idx > -1) state.list[idx] = action.payload;
      })
      .addCase(deleteInstance.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a._id !== action.payload);
      })
  },
});

export default instancesSlice.reducer;
