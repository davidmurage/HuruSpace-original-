import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Place } from '../store/slices/placesSlice';

interface AccessibilityMapProps {
  places: Place[];
}

const AccessibilityMap: React.FC<AccessibilityMapProps> = ({ places }) => {
  const points = useMemo(() => {
    const geoPlaces = places.filter(
      (place) =>
        place.location.latitude !== 0 || place.location.longitude !== 0
    );

    const hasGeoSpread =
      geoPlaces.length > 1 &&
      (new Set(geoPlaces.map((place) => place.location.latitude)).size > 1 ||
        new Set(geoPlaces.map((place) => place.location.longitude)).size > 1);

    if (hasGeoSpread) {
      const latitudes = geoPlaces.map((place) => place.location.latitude);
      const longitudes = geoPlaces.map((place) => place.location.longitude);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      return places.map((place, index) => ({
        ...place,
        id: `${place._id}-${index}`,
        x:
          ((place.location.longitude - minLng) / Math.max(maxLng - minLng, 0.01)) * 72 +
          12,
        y:
          (1 - (place.location.latitude - minLat) / Math.max(maxLat - minLat, 0.01)) *
            62 +
          16,
      }));
    }

    return places.map((place, index) => {
      const columns = 4;
      const row = Math.floor(index / columns);
      const column = index % columns;

      return {
        ...place,
        id: `${place._id}-${index}`,
        x: 14 + column * 20 + (row % 2) * 4,
        y: 22 + row * 20,
      };
    });
  }, [places]);

  if (!places.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Add places to see the Huruspaces community map preview.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Accessibility Map Preview
          </h3>
          <p className="text-sm text-slate-600">
            MVP preview of nearby accessible spaces with quick pin access.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {places.length} places
        </span>
      </div>

      <div className="relative mt-5 h-80 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-white to-emerald-100">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-10 top-8 h-20 w-48 rounded-full bg-sky-200 blur-2xl" />
          <div className="absolute right-10 top-12 h-24 w-24 rounded-full bg-emerald-200 blur-2xl" />
          <div className="absolute bottom-10 left-1/3 h-32 w-56 rounded-full bg-blue-200 blur-3xl" />
        </div>

        {points.map((place) => (
          <Link
            key={place.id}
            to={`/places/${place._id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${place.x}%`, top: `${place.y}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-blue-600 p-2 text-white shadow-lg transition hover:bg-blue-700">
                <MapPin size={18} />
              </span>
              <span className="max-w-24 rounded-full bg-white/90 px-2 py-1 text-center text-[11px] font-semibold text-slate-700 shadow-sm">
                {place.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AccessibilityMap;
