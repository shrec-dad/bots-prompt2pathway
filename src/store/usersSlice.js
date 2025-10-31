import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUsersAPI, addUserAPI, deleteUserAPI, updateUserAPI } from '../api';

// Fetch all users
export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const res = await getUsersAPI();
  return res.data;
});

// Add a new user
export const addUser = createAsyncThunk('users/add', async (data) => {
  const res = await addUserAPI(data);
  return res.data.user;
});

// Delete a user
export const deleteUser = createAsyncThunk('users/delete', async (id) => {
  await deleteUserAPI(id);
  return id;
});

// Update a user
export const updateUser = createAsyncThunk('users/update', async ({id,  data}) => {
  const res = await updateUserAPI(id, data);
  return res.data;
});

const usersSlice = createSlice({
  name: 'users',
  initialState: { list: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = 'succeeded';
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id !== action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u._id === action.payload._id);
        if (idx > -1) state.list[idx] = action.payload;
      });
  },
});

export default usersSlice.reducer;