import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { logout } from './authSlice';
import { API_URL } from '../../utils/config';

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Request failed';
  }

  return 'Request failed';
};

interface ReservationUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
}

interface ReservationPlace {
  _id: string;
  name: string;
  address: string;
  type: string;
  accessibilityScore: number;
  images: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  contact: {
    phone?: string;
    email?: string;
  };
}

export interface ReservationOwnerResponse {
  status: 'received' | 'confirmed' | 'declined';
  message: string;
  respondedAt?: string;
  respondedBy?: ReservationUser | string | null;
  isSystemGenerated?: boolean;
}

export interface ReservationRide {
  required: boolean;
  provider: 'cab' | 'uber';
  pickupAddress: string;
  pickupTime?: string;
  notes: string;
  accessibilityRequirements: string[];
  vehicleAccessibility: string[];
  driverName: string;
  driverPhone: string;
  vehicleDetails: string;
  providerName: string;
  status:
    | 'not-required'
    | 'received'
    | 'confirmed'
    | 'declined'
    | 'cancelled'
    | 'completed';
  statusMessage: string;
  respondedAt?: string;
  respondedBy?: ReservationUser | string | null;
  isSystemGenerated?: boolean;
}

export interface Reservation {
  _id: string;
  user: ReservationUser | string | null;
  place: ReservationPlace | string | null;
  reservationFor: string;
  guests: number;
  notes: string;
  accessibilitySupportNotes: string;
  status: 'received' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  ownerResponse: ReservationOwnerResponse;
  ride: ReservationRide;
  createdAt: string;
  updatedAt: string;
}

interface ReservationsState {
  reservations: Reservation[];
  managedReservations: Reservation[];
  transportReservations: Reservation[];
  isLoading: boolean;
  isManaging: boolean;
  isTransportLoading: boolean;
  error: string | null;
  managementError: string | null;
  transportError: string | null;
}

const initialState: ReservationsState = {
  reservations: [],
  managedReservations: [],
  transportReservations: [],
  isLoading: false,
  isManaging: false,
  isTransportLoading: false,
  error: null,
  managementError: null,
  transportError: null,
};

const getAuthToken = (getState: unknown) =>
  (getState as () => { auth: { token: string | null } })().auth.token;

const getAuthHeaders = (token: string | null) => ({
  Authorization: `Bearer ${token}`,
});

export const fetchMyReservations = createAsyncThunk(
  'reservations/fetchMyReservations',
  async (_, { getState, rejectWithValue }) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.get(`${API_URL}/reservations/my`, {
        headers: getAuthHeaders(token),
      });
      return response.data as Reservation[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchManagedReservations = createAsyncThunk(
  'reservations/fetchManagedReservations',
  async (_, { getState, rejectWithValue }) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.get(`${API_URL}/reservations/managed`, {
        headers: getAuthHeaders(token),
      });
      return response.data as Reservation[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchRideRequests = createAsyncThunk(
  'reservations/fetchRideRequests',
  async (_, { getState, rejectWithValue }) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.get(`${API_URL}/reservations/rides`, {
        headers: getAuthHeaders(token),
      });
      return response.data as Reservation[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createReservation = createAsyncThunk(
  'reservations/createReservation',
  async (
    payload: {
      placeId: string;
      reservationFor: string;
      guests: number;
      notes: string;
      accessibilitySupportNotes: string;
      ride: {
        required: boolean;
        provider: 'cab' | 'uber';
        pickupAddress: string;
        pickupTime: string;
        notes: string;
        accessibilityRequirements: string[];
      };
    },
    { getState, rejectWithValue }
  ) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.post(
        `${API_URL}/reservations`,
        {
          ...payload,
          ride: JSON.stringify(payload.ride),
        },
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data as Reservation;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const respondToReservation = createAsyncThunk(
  'reservations/respondToReservation',
  async (
    payload: {
      reservationId: string;
      status: 'confirmed' | 'declined';
      message: string;
    },
    { getState, rejectWithValue }
  ) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.patch(
        `${API_URL}/reservations/${payload.reservationId}/respond`,
        {
          status: payload.status,
          message: payload.message,
        },
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data as Reservation;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const respondToRideRequest = createAsyncThunk(
  'reservations/respondToRideRequest',
  async (
    payload: {
      reservationId: string;
      status: 'confirmed' | 'declined' | 'completed';
      message: string;
      providerName: string;
      vehicleAccessibility: string[];
      driverName: string;
      driverPhone: string;
      vehicleDetails: string;
    },
    { getState, rejectWithValue }
  ) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.patch(
        `${API_URL}/reservations/${payload.reservationId}/ride`,
        {
          status: payload.status,
          message: payload.message,
          providerName: payload.providerName,
          vehicleAccessibility: payload.vehicleAccessibility,
          driverName: payload.driverName,
          driverPhone: payload.driverPhone,
          vehicleDetails: payload.vehicleDetails,
        },
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data as Reservation;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelReservation = createAsyncThunk(
  'reservations/cancelReservation',
  async (reservationId: string, { getState, rejectWithValue }) => {
    const token = getAuthToken(getState);

    try {
      const response = await axios.patch(
        `${API_URL}/reservations/${reservationId}/cancel`,
        {},
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data as Reservation;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const normalizeReservation = (reservation: Reservation): Reservation => ({
  ...reservation,
  user:
    reservation.user && typeof reservation.user === 'object'
      ? {
          _id: reservation.user._id || reservation.user.id || '',
          id: reservation.user.id || reservation.user._id || '',
          name: reservation.user.name || 'Community member',
          email: reservation.user.email || '',
          role: reservation.user.role || '',
        }
      : reservation.user || 'Community member',
  place:
    reservation.place && typeof reservation.place === 'object'
      ? {
          _id: reservation.place._id || '',
          name: reservation.place.name || 'Reserved place',
          address: reservation.place.address || 'Address not available',
          type: reservation.place.type || 'place',
          accessibilityScore: Number(reservation.place.accessibilityScore || 0),
          images: reservation.place.images || [],
          location: {
            latitude: Number(reservation.place.location?.latitude || 0),
            longitude: Number(reservation.place.location?.longitude || 0),
          },
          contact: {
            phone: reservation.place.contact?.phone || '',
            email: reservation.place.contact?.email || '',
          },
        }
      : reservation.place || 'Reserved place',
  notes: reservation.notes || '',
  accessibilitySupportNotes: reservation.accessibilitySupportNotes || '',
  ownerResponse: {
    status: reservation.ownerResponse?.status || 'received',
    message: reservation.ownerResponse?.message || '',
    respondedAt: reservation.ownerResponse?.respondedAt || '',
    respondedBy: reservation.ownerResponse?.respondedBy || null,
    isSystemGenerated: Boolean(reservation.ownerResponse?.isSystemGenerated),
  },
  ride: {
    required: Boolean(reservation.ride?.required),
    provider: reservation.ride?.provider === 'uber' ? 'uber' : 'cab',
    pickupAddress: reservation.ride?.pickupAddress || '',
    pickupTime: reservation.ride?.pickupTime || '',
    notes: reservation.ride?.notes || '',
    accessibilityRequirements: reservation.ride?.accessibilityRequirements || [],
    vehicleAccessibility: reservation.ride?.vehicleAccessibility || [],
    driverName: reservation.ride?.driverName || '',
    driverPhone: reservation.ride?.driverPhone || '',
    vehicleDetails: reservation.ride?.vehicleDetails || '',
    providerName: reservation.ride?.providerName || '',
    status: reservation.ride?.status || 'not-required',
    statusMessage: reservation.ride?.statusMessage || '',
    respondedAt: reservation.ride?.respondedAt || '',
    respondedBy: reservation.ride?.respondedBy || null,
    isSystemGenerated: Boolean(reservation.ride?.isSystemGenerated),
  },
});

const normalizeReservations = (reservations: Reservation[]) =>
  reservations.map(normalizeReservation);

const upsertReservation = (
  reservations: Reservation[],
  updatedReservation: Reservation
) => {
  const index = reservations.findIndex(
    (reservation) => reservation._id === updatedReservation._id
  );

  if (index === -1) {
    return [updatedReservation, ...reservations];
  }

  const nextReservations = [...reservations];
  nextReservations[index] = updatedReservation;
  return nextReservations;
};

const mergeReservation = (state: ReservationsState, reservation: Reservation) => {
  const normalizedReservation = normalizeReservation(reservation);
  state.reservations = upsertReservation(state.reservations, normalizedReservation);
  state.managedReservations = upsertReservation(
    state.managedReservations,
    normalizedReservation
  );
  state.transportReservations = upsertReservation(
    state.transportReservations,
    normalizedReservation
  );
};

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    clearReservationsError: (state) => {
      state.error = null;
      state.managementError = null;
      state.transportError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = normalizeReservations(action.payload);
      })
      .addCase(fetchMyReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch reservations';
      })
      .addCase(fetchManagedReservations.pending, (state) => {
        state.isManaging = true;
        state.managementError = null;
      })
      .addCase(fetchManagedReservations.fulfilled, (state, action) => {
        state.isManaging = false;
        state.managedReservations = normalizeReservations(action.payload);
      })
      .addCase(fetchManagedReservations.rejected, (state, action) => {
        state.isManaging = false;
        state.managementError =
          (action.payload as string) || 'Failed to fetch reservation inbox';
      })
      .addCase(fetchRideRequests.pending, (state) => {
        state.isTransportLoading = true;
        state.transportError = null;
      })
      .addCase(fetchRideRequests.fulfilled, (state, action) => {
        state.isTransportLoading = false;
        state.transportReservations = normalizeReservations(action.payload);
      })
      .addCase(fetchRideRequests.rejected, (state, action) => {
        state.isTransportLoading = false;
        state.transportError =
          (action.payload as string) || 'Failed to fetch ride requests';
      })
      .addCase(createReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        mergeReservation(state, action.payload);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to create reservation';
      })
      .addCase(cancelReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        mergeReservation(state, action.payload);
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to cancel reservation';
      })
      .addCase(respondToReservation.pending, (state) => {
        state.isManaging = true;
        state.managementError = null;
      })
      .addCase(respondToReservation.fulfilled, (state, action) => {
        state.isManaging = false;
        mergeReservation(state, action.payload);
      })
      .addCase(respondToReservation.rejected, (state, action) => {
        state.isManaging = false;
        state.managementError =
          (action.payload as string) || 'Failed to respond to reservation';
      })
      .addCase(respondToRideRequest.pending, (state) => {
        state.isTransportLoading = true;
        state.transportError = null;
      })
      .addCase(respondToRideRequest.fulfilled, (state, action) => {
        state.isTransportLoading = false;
        mergeReservation(state, action.payload);
      })
      .addCase(respondToRideRequest.rejected, (state, action) => {
        state.isTransportLoading = false;
        state.transportError =
          (action.payload as string) || 'Failed to respond to ride request';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearReservationsError } = reservationsSlice.actions;
export default reservationsSlice.reducer;
