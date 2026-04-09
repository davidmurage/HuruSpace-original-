import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MapPin } from 'lucide-react';
import { Place } from '../store/slices/placesSlice';
import {
  buildOpenStreetMapEmbedUrl,
  buildOpenStreetMapPageUrl,
  hasCoordinates,
} from '../utils/location';

interface AccessibilityMapProps {
  places: Place[];
  highlightedPlaceId?: string;
  title?: string;
  description?: string;
  maxPlaceCards?: number;
  iframeHeightClass?: string;
}

const AccessibilityMap: React.FC<AccessibilityMapProps> = ({
  places,
  highlightedPlaceId,
  title = 'Accessibility Map',
  description = 'Explore precise place coordinates with OpenStreetMap.',
  maxPlaceCards = 9,
  iframeHeightClass = 'h-80',
}) => {
  const placesWithCoordinates = useMemo(
    () => places.filter((place) => hasCoordinates(place.location)),
    [places]
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    highlightedPlaceId || placesWithCoordinates[0]?._id || null
  );

  useEffect(() => {
    if (highlightedPlaceId) {
      setSelectedPlaceId(highlightedPlaceId);
      return;
    }

    if (!selectedPlaceId && placesWithCoordinates[0]) {
      setSelectedPlaceId(placesWithCoordinates[0]._id);
    }
  }, [highlightedPlaceId, placesWithCoordinates, selectedPlaceId]);

  const selectedPlace =
    placesWithCoordinates.find((place) => place._id === selectedPlaceId) ||
    placesWithCoordinates[0] ||
    null;

  if (!places.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Add places to see them on the Huruspaces map.
      </div>
    );
  }

  if (!selectedPlace) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No places with usable coordinates are available yet.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <a
          href={buildOpenStreetMapPageUrl(selectedPlace.location)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Open full map
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
        <iframe
          title={`${selectedPlace.name} map`}
          src={buildOpenStreetMapEmbedUrl(selectedPlace.location)}
          className={`${iframeHeightClass} w-full border-0`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {placesWithCoordinates.slice(0, maxPlaceCards).map((place) => (
          <div
            key={place._id}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              selectedPlace._id === place._id
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedPlaceId(place._id)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin size={14} />
                {place.name}
              </div>
            </button>
            <div className="mt-1 text-xs text-slate-500">{place.address}</div>
            <div className="mt-2">
              <Link
                to={`/places/${place._id}`}
                className="text-xs font-semibold text-blue-700"
              >
                View details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccessibilityMap;
