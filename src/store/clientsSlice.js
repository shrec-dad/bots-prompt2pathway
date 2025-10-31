import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getClientsAPI,
  createClientAPI,
  updateClientAPI,
  deleteClientAPI
} from '../api';

export const fetchClients = createAsyncThunk('clients/fetchAll', async () => {
  const res = await getClientsAPI();
  return res.data;
});

export const addClient = createAsyncThunk('clients/add', async (data) => {
  const res = await createClientAPI(data);
  return res.data;
});

export const updateClient = createAsyncThunk('clients/update', async ({ id, data }) => {
  const res = await updateClientAPI(id, data);
  return res.data;
});

export const deleteClient = createAsyncThunk('clients/delete', async (id) => {
  await deleteClientAPI(id);
  return id;
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState: { list: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = 'succeeded';
      })
      .addCase(addClient.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const idx = state.list.findIndex((l) => l._id === action.payload._id);
        if (idx > -1) state.list[idx] = action.payload;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id !== action.payload);
      })
  },
});

export default clientsSlice.reducer;
