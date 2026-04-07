import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search } from 'lucide-react';
import AccessibilityMap from '../components/AccessibilityMap';
import PlaceCard from '../components/PlaceCard';
import PlaceFilters from '../components/PlaceFilters';
import PlaceForm from '../components/PlaceForm';
import { getPreferredFeatures } from '../constants/accessibility';
import { createPlace, fetchPlaces, setFilters } from '../store/slices/placesSlice';
import { RootState, AppDispatch } from '../store/store';

const Places: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { filteredPlaces, filters, isLoading, error } = useSelector(
    (state: RootState) => state.places
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchPlaces());
  }, [dispatch]);

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
    await dispatch(createPlace(formData));
    setShowForm(false);
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

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <PlaceFilters />

          <div className="space-y-8">
            <AccessibilityMap places={filteredPlaces.slice(0, 12)} />

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Matching places
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {filteredPlaces.length} result(s) based on your current filters
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                Loading accessible places...
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                No places match the current search and filters yet.
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {filteredPlaces.map((place) => (
                  <PlaceCard key={place._id} place={place} />
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
