import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import placesSlice from './slices/placesSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    places: placesSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;