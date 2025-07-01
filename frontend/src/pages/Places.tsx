import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchPlaces, setFilters } from '../store/slices/placesSlice';
import PlaceCard from '../components/PlaceCard';
import PlaceFilters from '../components/PlaceFilters';
import { Search, MapPin } from 'lucide-react';

const Places: React.FC = () => {
  const dispatch = useDispatch();
  const { filteredPlaces, isLoading, filters } = useSelector((state: RootState) => state.places);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchPlaces() as any);
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ searchTerm }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accessible places...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Accessible Places
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find restaurants and offices that welcome everyone with accessibility features designed for PWD.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <PlaceFilters />
          </div>

          {/* Places Grid */}
          <div className="lg:w-3/4">
            {filteredPlaces.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No places found</h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms to find more places.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPlaces.map((place) => (
                  <PlaceCard key={place._id} place={place} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Places;