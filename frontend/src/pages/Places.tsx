import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, Plus, Search } from 'lucide-react';
import AccessibilityMap from '../components/AccessibilityMap';
import LiveRefreshStatus from '../components/LiveRefreshStatus';
import PlaceCard from '../components/PlaceCard';
import PlaceFilters from '../components/PlaceFilters';
import PlaceForm from '../components/PlaceForm';
import VoiceAssistant from '../components/VoiceAssistant';
import { getPreferredFeatures } from '../constants/accessibility';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import { useUserLocation } from '../hooks/useUserLocation';
import {
  clearFilters,
  createPlace,
  fetchPlaces,
  setFilters,
} from '../store/slices/placesSlice';
import { RootState, AppDispatch } from '../store/store';
import { calculateDistanceKm, formatDistanceKm, hasCoordinates } from '../utils/location';

const Places: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { filteredPlaces, filters, isLoading, error } = useSelector(
    (state: RootState) => state.places
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { location, isLocating, locationError, requestLocation } = useUserLocation();
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);
  const [showForm, setShowForm] = useState(false);

  const refreshPlaces = useCallback(
    () => dispatch(fetchPlaces()).unwrap(),
    [dispatch]
  );

  const {
    isRefreshing: isRefreshingPlaces,
    lastRefreshError: placesRefreshError,
    lastUpdatedAt: placesLastUpdatedAt,
    refreshNow: refreshPlacesNow,
  } = useRealtimeRefresh({
    intervalMs: 45000,
    onRefresh: refreshPlaces,
  });

  useEffect(() => {
    refreshPlaces();
  }, [refreshPlaces]);

  const quickSummary = useMemo(() => {
    if (!user) {
      return 'Sign in to personalize discovery using your accessibility profile.';
    }

    const preferred = getPreferredFeatures(user.accessibilityProfile);

    if (!preferred.length) {
      return 'Your profile is ready. Add preferred features in the dashboard for deeper personalization.';
    }

    return `Showing spaces that can match preferences like ${preferred
      .slice(0, 3)
      .join(', ')}.`;
  }, [user]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(setFilters({ searchTerm }));
  };

  const handleCreatePlace = async (formData: FormData) => {
    await dispatch(createPlace(formData)).unwrap();
    setShowForm(false);
  };

  const applyProfileFilters = () => {
    if (!user) {
      return;
    }

    dispatch(
      setFilters({
        needs: user.accessibilityProfile.needs,
        features: getPreferredFeatures(user.accessibilityProfile),
      })
    );
  };

  const placesWithDistance = useMemo(
    () =>
      filteredPlaces
        .map((place) => ({
          place,
          distanceKm:
            location && hasCoordinates(place.location)
              ? calculateDistanceKm(location, place.location)
              : null,
        }))
        .sort((left, right) => {
          if (left.distanceKm !== null && right.distanceKm !== null) {
            return left.distanceKm - right.distanceKm;
          }

          if (left.distanceKm !== null) {
            return -1;
          }

          if (right.distanceKm !== null) {
            return 1;
          }

          return right.place.accessibilityScore - left.place.accessibilityScore;
        }),
    [filteredPlaces, location]
  );

  const visiblePlaces = placesWithDistance.map((entry) => entry.place);

  const activeAlertCount = useMemo(
    () =>
      visiblePlaces.reduce(
        (total, place) =>
          total + place.alerts.filter((alert) => alert.status === 'active').length,
        0
      ),
    [visiblePlaces]
  );

  const resultsSummary = useMemo(() => {
    if (!visiblePlaces.length) {
      return 'No places currently match your search and accessibility filters.';
    }

    const topPlaces = visiblePlaces
      .slice(0, 3)
      .map((place) => place.name)
      .join(', ');

    const alertSummary =
      activeAlertCount > 0
        ? `${activeAlertCount} active accessibility alert${
            activeAlertCount > 1 ? 's are' : ' is'
          } visible in these results.`
        : 'No active alerts are visible in these results.';

    return `${visiblePlaces.length} places match right now. Top matches include ${topPlaces}. ${alertSummary}`;
  }, [activeAlertCount, visiblePlaces]);

  const handleVoiceCommand = async (command: string) => {
    const normalized = command.toLowerCase().trim();

    if (!normalized) {
      return 'I did not catch that. Try saying find restaurants or use my profile.';
    }

    if (normalized.includes('clear')) {
      setSearchTerm('');
      dispatch(clearFilters());
      return 'Filters cleared. Showing all places again.';
    }

    if (normalized.includes('my profile')) {
      applyProfileFilters();
      return 'Applied your accessibility profile to discovery filters.';
    }

    if (normalized.includes('near me') || normalized.includes('my location')) {
      requestLocation();
      return 'Getting your location now. Nearby places will move to the top.';
    }

    if (normalized.includes('refresh') || normalized.includes('update')) {
      const didRefresh = await refreshPlacesNow();
      return didRefresh
        ? 'Discovery results refreshed with the latest accessibility alerts.'
        : 'I could not refresh discovery results just now. Please try again.';
    }

    if (normalized.includes('alert')) {
      return activeAlertCount > 0
        ? `There are ${activeAlertCount} active accessibility alerts in the visible results.`
        : 'There are no active accessibility alerts in the visible results.';
    }

    const placeType = ['restaurant', 'office', 'venue', 'clinic', 'hotel', 'public-space'].find(
      (type) => normalized.includes(type.replace('-', ' ')) || normalized.includes(type)
    );

    if (placeType) {
      dispatch(setFilters({ type: placeType }));
      return `Filtering places to show ${placeType.replace('-', ' ')} options. ${resultsSummary}`;
    }

    if (normalized.startsWith('find ')) {
      const query = normalized.replace(/^find\s+/, '').trim();
      setSearchTerm(query);
      dispatch(setFilters({ searchTerm: query }));
      return `Searching for ${query}.`;
    }

    if (normalized.startsWith('search for ')) {
      const query = normalized.replace(/^search for\s+/, '').trim();
      setSearchTerm(query);
      dispatch(setFilters({ searchTerm: query }));
      return `Searching for ${query}.`;
    }

    if (normalized.includes('open first') || normalized.includes('open top')) {
      if (!visiblePlaces.length) {
        return 'There is no matching place to open right now.';
      }

      navigate(`/places/${visiblePlaces[0]._id}`);
      return `Opening ${visiblePlaces[0].name}.`;
    }

    return resultsSummary;
  };

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 px-6 py-8 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold">Discover accessible spaces</h1>
              <p className="mt-3 text-lg text-blue-50">
                Search community-verified places, compare accessibility details,
                and contribute new spaces to the map.
              </p>
              <p className="mt-3 text-sm text-blue-100">{quickSummary}</p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
              >
                <Plus size={18} />
                Add place
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by place name, address, or accessibility notes"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-28 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <LocateFixed size={16} />
            {isLocating ? 'Locating...' : 'Use my location'}
          </button>
        </div>

        {locationError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {locationError}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <PlaceFilters />

          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
              <AccessibilityMap
                places={visiblePlaces.slice(0, 8)}
                title="Accessibility map"
                description="Preview the strongest matching places without leaving the results view."
                maxPlaceCards={6}
                iframeHeightClass="h-72"
              />

              <div className="space-y-6">
                <LiveRefreshStatus
                  title="Live place updates"
                  description="Huruspaces checks for new accessibility alerts and place updates every 45 seconds while this page is visible."
                  isRefreshing={isRefreshingPlaces}
                  lastRefreshError={placesRefreshError}
                  lastUpdatedAt={placesLastUpdatedAt}
                  onRefresh={refreshPlacesNow}
                />

                <VoiceAssistant
                  title="Voice discovery"
                  description="Search places and control discovery using browser voice commands and spoken summaries."
                  commandExamples={[
                    'Find accessible restaurants',
                    'Use my profile',
                    'Read alerts',
                    'Refresh results',
                    'Show offices',
                    'Open first place',
                  ]}
                  onCommand={handleVoiceCommand}
                  getSummary={() => resultsSummary}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Matching places
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {filteredPlaces.length} result(s) based on your current filters
                  </p>
                  <p className="mt-3 max-w-3xl text-sm text-slate-600">
                    {resultsSummary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {location && (
                    <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      Sorted near you
                    </span>
                  )}
                  {activeAlertCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
                      {activeAlertCount} active accessibility alert
                      {activeAlertCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isLoading && filteredPlaces.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                Loading accessible places...
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                No places match the current search and filters yet.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {placesWithDistance.map(({ place, distanceKm }) => (
                  <PlaceCard
                    key={place._id}
                    place={place}
                    distanceLabel={distanceKm !== null ? formatDistanceKm(distanceKm) : null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div className="w-full max-w-4xl">
              <PlaceForm onSubmit={handleCreatePlace} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Places;
