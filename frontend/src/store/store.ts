import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import placesSlice from './slices/placesSlice';
import reservationsSlice from './slices/reservationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    places: placesSlice,
    reservations: reservationsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
