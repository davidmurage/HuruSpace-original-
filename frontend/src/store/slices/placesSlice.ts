import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../utils/config';


export interface Place {
  _id: string;
  name: string;
  type: 'restaurant' | 'office';
  address: string;
  description: string;
  accessibilityFeatures: string[];
  images: string[];
  rating: number;
  contact: {
    phone: string;
    email: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  createdBy: string;
  createdAt: string;
}

interface PlacesState {
  places: Place[];
  filteredPlaces: Place[];
  isLoading: boolean;
  error: string | null;
  filters: {
    type: 'all' | 'restaurant' | 'office';
    features: string[];
    searchTerm: string;
  };
}

const initialState: PlacesState = {
  places: [],
  filteredPlaces: [],
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
    features: [],
    searchTerm: '',
  },
};

export const fetchPlaces = createAsyncThunk('places/fetchPlaces', async () => {
  const response = await axios.get(`${API_URL}/places`);
  return response.data;
});

export const createPlace = createAsyncThunk(
  'places/createPlace',
  async (placeData: FormData, { getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    const response = await axios.post(`${API_URL}/places`, placeData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const updatePlace = createAsyncThunk(
  'places/updatePlace',
  async ({ id, placeData }: { id: string; placeData: FormData }, { getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    const response = await axios.put(`${API_URL}/places/${id}`, placeData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const deletePlace = createAsyncThunk(
  'places/deletePlace',
  async (id: string, { getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    await axios.delete(`${API_URL}/places/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return id;
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
        features: [],
        searchTerm: '',
      };
      state.filteredPlaces = state.places;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaces.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.places = action.payload;
        state.filteredPlaces = filterPlaces(action.payload, state.filters);
      })
      .addCase(fetchPlaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch places';
      })
      .addCase(createPlace.fulfilled, (state, action) => {
        state.places.push(action.payload);
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      })
      .addCase(updatePlace.fulfilled, (state, action) => {
        const index = state.places.findIndex(place => place._id === action.payload._id);
        if (index !== -1) {
          state.places[index] = action.payload;
        }
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      })
      .addCase(deletePlace.fulfilled, (state, action) => {
        state.places = state.places.filter(place => place._id !== action.payload);
        state.filteredPlaces = filterPlaces(state.places, state.filters);
      });
  },
});

function filterPlaces(places: Place[], filters: PlacesState['filters']) {
  return places.filter(place => {
    const matchesType = filters.type === 'all' || place.type === filters.type;
    const matchesFeatures = filters.features.length === 0 || 
      filters.features.every(feature => place.accessibilityFeatures.includes(feature));
    const matchesSearch = !filters.searchTerm || 
      place.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      place.address.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesType && matchesFeatures && matchesSearch;
  });
}

export const { setFilters, clearFilters } = placesSlice.actions;
export default placesSlice.reducer;