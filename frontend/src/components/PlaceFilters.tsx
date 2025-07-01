import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setFilters, clearFilters } from '../store/slices/placesSlice';
import { Filter, X } from 'lucide-react';

const PlaceFilters: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.places);

  const accessibilityFeatures = [
    'Wheelchair Accessible',
    'Braille Signage',
    'Audio Assistance',
    'Sign Language Support',
    'Accessible Parking',
    'Accessible Restrooms',
    'Elevator Access',
    'Wide Doorways',
    'Accessible Seating',
    'Service Animal Friendly'
  ];

  const handleTypeChange = (type: 'all' | 'restaurant' | 'office') => {
    dispatch(setFilters({ type }));
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature];
    dispatch(setFilters({ features: newFeatures }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="mr-2" size={20} />
          Filters
        </h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <X size={16} className="mr-1" />
          Clear All
        </button>
      </div>

      {/* Place Type Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Place Type</h4>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Places' },
            { value: 'restaurant', label: 'Restaurants' },
            { value: 'office', label: 'Offices' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="placeType"
                value={option.value}
                checked={filters.type === option.value}
                onChange={() => handleTypeChange(option.value as any)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accessibility Features Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Accessibility Features</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {accessibilityFeatures.map((feature) => (
            <label key={feature} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.features.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.type !== 'all' || filters.features.length > 0) && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {filters.type !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {filters.type}
              </span>
            )}
            {filters.features.map((feature) => (
              <span
                key={feature}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceFilters;