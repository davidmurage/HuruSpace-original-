import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Filter, RotateCcw, Sparkles } from 'lucide-react';
import {
  ACCESSIBILITY_OPTIONS,
  NEED_LABELS,
  PLACE_TYPES,
  getPreferredFeatures,
} from '../constants/accessibility';
import { RootState, AppDispatch } from '../store/store';
import { clearFilters, setFilters } from '../store/slices/placesSlice';
import { NeedCategory } from '../types/accessibility';

const PlaceFilters: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { filters } = useSelector((state: RootState) => state.places);
  const { user } = useSelector((state: RootState) => state.auth);

  const visibleCategories =
    filters.needs.length > 0
      ? filters.needs
      : user?.accessibilityProfile.needs.length
        ? user.accessibilityProfile.needs
        : (Object.keys(ACCESSIBILITY_OPTIONS) as NeedCategory[]);

  const featureOptions = Array.from(
    new Set(visibleCategories.flatMap((category) => ACCESSIBILITY_OPTIONS[category]))
  );

  const toggleNeed = (category: NeedCategory) => {
    const needs = filters.needs.includes(category)
      ? filters.needs.filter((entry) => entry !== category)
      : [...filters.needs, category];

    dispatch(setFilters({ needs, features: [] }));
  };

  const toggleFeature = (feature: string) => {
    const features = filters.features.includes(feature)
      ? filters.features.filter((entry) => entry !== feature)
      : [...filters.features, feature];

    dispatch(setFilters({ features }));
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

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Filter size={18} />
            Discovery Filters
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Narrow places by type, access needs, and practical features.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(clearFilters())}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {user && (
        <button
          type="button"
          onClick={applyProfileFilters}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Sparkles size={16} />
          Use My Accessibility Profile
        </button>
      )}

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Place Type
        </h4>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => dispatch(setFilters({ type: 'all' }))}
            className={`rounded-full px-3 py-2 text-sm ${
              filters.type === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            All
          </button>
          {PLACE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => dispatch(setFilters({ type }))}
              className={`rounded-full px-3 py-2 text-sm capitalize ${
                filters.type === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {type.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Need Categories
        </h4>
        <div className="mt-3 grid gap-2">
          {(Object.keys(NEED_LABELS) as NeedCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleNeed(category)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                filters.needs.includes(category)
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300'
              }`}
            >
              {NEED_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Feature Match
        </h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {featureOptions.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => toggleFeature(feature)}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                filters.features.includes(feature)
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default PlaceFilters;
