import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getRecipientsAPI,
  createRecipientsAPI,
  deleteRecipientsAPI
} from '../api';

export const fetchRecipients = createAsyncThunk('recipients/fetchAll', async (instId) => {
  const res = await getRecipientsAPI(instId);
  return res.data;
});

export const addRecipients = createAsyncThunk('recipients/add', async ({instId, recipients}) => {
  const res = await createRecipientsAPI(instId, recipients);
  return res.data;
});

export const deleteRecipients = createAsyncThunk('recipients/delete', async (ids) => {
  await deleteRecipientsAPI(ids);
  return ids;
});

const recipientsSlice = createSlice({
  name: 'recipients',
  initialState: { list: [], status: 'idle', error: null },
  reducers: {
    clearRecipients: (state) => {
      state.list = [];
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecipients.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchRecipients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addRecipients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addRecipients.fulfilled, (state, action) => {
        state.list.push(...action.payload);
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(addRecipients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(deleteRecipients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteRecipients.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => !action.payload.includes(u._id));
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(deleteRecipients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
  },
});

export const { clearRecipients } = recipientsSlice.actions;
export default recipientsSlice.reducer;
