import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDocsAPI,
  createDocAPI,
  deleteDocAPI,
} from '../api';

export const fetchDocs = createAsyncThunk('docs/fetchAll', async (id) => {
  const res = await getDocsAPI(id);
  return res.data;
});

export const addDoc = createAsyncThunk('docs/add', async (data) => {
  const res = await createDocAPI(data);
  return res.data;
});

export const deleteDoc = createAsyncThunk('docs/delete', async (id) => {
  await deleteDocAPI(id);
  return id;
});

const docsSlice = createSlice({
  name: 'docs',
  initialState: { list: [], selected: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocs.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = 'succeeded';
      })
      .addCase(addDoc.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addDoc.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(deleteDoc.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a._id !== action.payload);
      })
  },
});

export default docsSlice.reducer;
