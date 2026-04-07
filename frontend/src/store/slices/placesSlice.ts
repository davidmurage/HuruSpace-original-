import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { normalizeAccessibilityDetails } from '../../constants/accessibility';
import { API_URL } from '../../utils/config';
import { AccessibilityDetails, NeedCategory } from '../../types/accessibility';

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Request failed';
  }

  return 'Request failed';
};

interface PlaceReviewUser {
  _id?: string;
  id?: string;
  name: string;
}

export interface PlaceReview {
  _id?: string;
  user: PlaceReviewUser | string;
  accessibilityRating: number;
  comment: string;
  issueFlags: string[];
  createdAt: string;
}

interface PlaceCreator {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

export interface Place {
  _id: string;
  name: string;
  type: string;
  address: string;
  description: string;
  accessibilityFeatures: string[];
  accessibilityDetails: AccessibilityDetails;
  images: string[];
  accessibilityScore: number;
  verificationStatus: 'community' | 'verified';
  reviews: PlaceReview[];
  rating: number;
  contact: {
    phone: string;
    email: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  createdBy: PlaceCreator | string;
  createdAt: string;
}

interface PlacesState {
  places: Place[];
  filteredPlaces: Place[];
  selectedPlace: Place | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type: 'all' | string;
    needs: NeedCategory[];
    features: string[];
    searchTerm: string;
  };
}

const initialState: PlacesState = {
  places: [],
  filteredPlaces: [],
  selectedPlace: null,
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
    needs: [],
    features: [],
    searchTerm: '',
  },
};

export const fetchPlaces = createAsyncThunk(
  'places/fetchPlaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/places`);
      return response.data as Place[];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPlaceById = createAsyncThunk(
  'places/fetchPlaceById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/places/${id}`);
      return response.data as Place;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createPlace = createAsyncThunk(
  'places/createPlace',
  async (placeData: FormData, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };

    try {
      const response = await axios.post(`${API_URL}/places`, placeData, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as Place;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updatePlace = createAsyncThunk(
  'places/updatePlace',
  async (
    { id, placeData }: { id: string; placeData: FormData },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { auth: { token: string | null } };

    try {
      const response = await axios.put(`${API_URL}/places/${id}`, placeData, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as Place;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deletePlace = createAsyncThunk(
  'places/deletePlace',
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };

    try {
      await axios.delete(`${API_URL}/places/${id}`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addReview = createAsyncThunk(
  'places/addReview',
  async (
    {
      placeId,
      accessibilityRating,
      comment,
      issueFlags,
    }: {
      placeId: string;
      accessibilityRating: number;
      comment: string;
      issueFlags: string[];
    },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { auth: { token: string | null } };

    try {
      const response = await axios.post(
        `${API_URL}/places/${placeId}/reviews`,
        { accessibilityRating, comment, issueFlags },
        {
          headers: {
            Authorization: `Bearer ${state.auth.token}`,
          },
        }
      );
      return response.data as Place;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.filteredPlaces = filterPlaces(state.places, state.filters);
    },
    clearFilters: (state) => {
      state.filters = {
        type: 'all',
        needs: [],
        features: [],
        searchTerm: '',
      };
      state.filteredPlaces = state.places;
    },
    clearSelectedPlace: (state) => {
      state.selectedPlace = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.places = normalizePlaces(action.payload);
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      })
      .addCase(fetchPlaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch places';
      })
      .addCase(fetchPlaceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlaceById.fulfilled, (state, action) => {
        state.isLoading = false;
        const normalizedPlace = normalizePlace(action.payload);
        state.selectedPlace = normalizedPlace;
        state.places = upsertPlace(state.places, normalizedPlace);
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      })
      .addCase(fetchPlaceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch place details';
      })
      .addCase(createPlace.fulfilled, (state, action) => {
        state.places.unshift(normalizePlace(action.payload));
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      })
      .addCase(updatePlace.fulfilled, (state, action) => {
        const updatedPlace = normalizePlace(action.payload);
        state.places = upsertPlace(state.places, updatedPlace);
        state.selectedPlace =
          state.selectedPlace?._id === updatedPlace._id ? updatedPlace : state.selectedPlace;
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      })
      .addCase(deletePlace.fulfilled, (state, action) => {
        state.places = state.places.filter((place) => place._id !== action.payload);
        state.filteredPlaces = filterPlaces(state.places, state.filters);
        if (state.selectedPlace?._id === action.payload) {
          state.selectedPlace = null;
        }
      })
      .addCase(addReview.fulfilled, (state, action) => {
        const updatedPlace = normalizePlace(action.payload);
        state.places = upsertPlace(state.places, updatedPlace);
        state.selectedPlace = updatedPlace;
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      });
  },
});

function filterPlaces(places: Place[], filters: PlacesState['filters']) {
  return places
    .filter((place) => {
      const details = normalizeAccessibilityDetails(place.accessibilityDetails);
      const matchesType = filters.type === 'all' || place.type === filters.type;
      const matchesNeeds =
        filters.needs.length === 0 ||
        filters.needs.every((need) => (details[need] || []).length > 0);
      const matchesFeatures =
        filters.features.length === 0 ||
        filters.features.every((feature) => place.accessibilityFeatures.includes(feature));
      const matchesSearch =
        !filters.searchTerm ||
        place.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        place.address.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        place.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesType && matchesNeeds && matchesFeatures && matchesSearch;
    })
    .sort((a, b) => b.accessibilityScore - a.accessibilityScore);
}

function normalizePlace(place: Place): Place {
  return {
    ...place,
    accessibilityDetails: normalizeAccessibilityDetails(place.accessibilityDetails),
    accessibilityFeatures: place.accessibilityFeatures || [],
    reviews: place.reviews || [],
    images: place.images || [],
    contact: {
      phone: place.contact?.phone || '',
      email: place.contact?.email || '',
    },
    location: {
      latitude: Number(place.location?.latitude || 0),
      longitude: Number(place.location?.longitude || 0),
    },
  };
}

function normalizePlaces(places: Place[]) {
  return places.map(normalizePlace);
}

function upsertPlace(places: Place[], updatedPlace: Place) {
  const index = places.findIndex((place) => place._id === updatedPlace._id);

  if (index === -1) {
    return [updatedPlace, ...places];
  }

  const nextPlaces = [...places];
  nextPlaces[index] = updatedPlace;
  return nextPlaces;
}

export const { setFilters, clearFilters, clearSelectedPlace } = placesSlice.actions;
export default placesSlice.reducer;
