import React, { useMemo } from 'react';
import { Navigation, Route, LocateFixed } from 'lucide-react';
import { NEED_LABELS } from '../constants/accessibility';
import { Place } from '../store/slices/placesSlice';
import { AccessibilityProfile, NeedCategory } from '../types/accessibility';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPlaceUrl,
  buildOpenStreetMapDirectionsUrl,
  buildOpenStreetMapPageUrl,
  calculateDistanceKm,
  formatDistanceKm,
  hasCoordinates,
} from '../utils/location';
import { useUserLocation } from '../hooks/useUserLocation';

interface PlaceNavigationPanelProps {
  place: Place;
  profile?: AccessibilityProfile | null;
}

const PlaceNavigationPanel: React.FC<PlaceNavigationPanelProps> = ({ place, profile }) => {
  const { location, isLocating, locationError, requestLocation } = useUserLocation();

  const activeAlerts = place.alerts.filter((alert) => alert.status === 'active');
  const hasPlaceCoordinates = hasCoordinates(place.location);

  const distanceKm = useMemo(() => {
    if (!location || !hasPlaceCoordinates) {
      return null;
    }

    return calculateDistanceKm(location, place.location);
  }, [location, place.location, hasPlaceCoordinates]);

  const routeNotes = useMemo(() => {
    const notes: string[] = [];
    const activeNeeds = profile?.needs || [];

    activeNeeds.forEach((need) => {
      const features = place.accessibilityDetails[need as NeedCategory] || [];
      if (features.length > 0) {
        notes.push(
          `${NEED_LABELS[need as NeedCategory]} support reported: ${features.join(', ')}.`
        );
      } else {
        notes.push(
          `${NEED_LABELS[need as NeedCategory]} support has not been clearly reported yet.`
        );
      }
    });

    activeAlerts.slice(0, 2).forEach((alert) => {
      notes.push(
        `Current alert: ${alert.message || 'A temporary accessibility issue has been reported.'}`
      );
    });

    if (!notes.length) {
      notes.push(
        'Use the latest reviews and alerts to confirm accessibility conditions before traveling.'
      );
    }

    return notes;
  }, [activeAlerts, place.accessibilityDetails, profile?.needs]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Route className="text-blue-700" size={20} />
        <h2 className="text-lg font-semibold text-slate-900">
          Accessible navigation
        </h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Use your current location, route links, and accessibility notes before
        heading out.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <LocateFixed size={16} />
          {isLocating ? 'Locating...' : 'Use my current location'}
        </button>

        {hasPlaceCoordinates && (
          <>
            <a
              href={location ? buildGoogleMapsDirectionsUrl(place.location, location) : buildGoogleMapsPlaceUrl(place.location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <Navigation size={16} />
              Open Google Maps
            </a>
            <a
              href={
                location
                  ? buildOpenStreetMapDirectionsUrl(location, place.location)
                  : buildOpenStreetMapPageUrl(place.location)
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              OpenStreetMap
            </a>
          </>
        )}
      </div>

      {distanceKm !== null && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          Estimated direct distance from you: <strong>{formatDistanceKm(distanceKm)}</strong>
        </div>
      )}

      {locationError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {locationError}
        </div>
      )}

      {!hasPlaceCoordinates && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          This place does not have precise coordinates yet, so route links are unavailable.
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Route considerations
        </h3>
        <div className="mt-3 space-y-3">
          {routeNotes.map((note) => (
            <div
              key={note}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
            >
              {note}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlaceNavigationPanel;
