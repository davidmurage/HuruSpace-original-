import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { MapPin, MessageSquare, Phone, ShieldCheck, Star } from 'lucide-react';
import AccessibilityMap from '../components/AccessibilityMap';
import LiveRefreshStatus from '../components/LiveRefreshStatus';
import PlaceAlertsPanel from '../components/PlaceAlertsPanel';
import PlaceNavigationPanel from '../components/PlaceNavigationPanel';
import ReservationForm from '../components/ReservationForm';
import VoiceAssistant from '../components/VoiceAssistant';
import {
  NEED_LABELS,
  getTransportRequirements,
  normalizeAccessibilityDetails,
} from '../constants/accessibility';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import {
  addAlert,
  addReview,
  fetchPlaceById,
  resolveAlert,
  PlaceAlert,
} from '../store/slices/placesSlice';
import { createReservation } from '../store/slices/reservationsSlice';
import { RootState, AppDispatch } from '../store/store';
import { NeedCategory } from '../types/accessibility';
import { speakText } from '../utils/speech';

const getAlertIdentity = (alert: PlaceAlert, index: number) =>
  alert._id || `${alert.alertType}-${alert.createdAt}-${index}`;

const PlaceDetails: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams();
  const { places, selectedPlace, isLoading } = useSelector(
    (state: RootState) => state.places
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [accessibilityRating, setAccessibilityRating] = useState(5);
  const [comment, setComment] = useState('');
  const [issueFlags, setIssueFlags] = useState('');
  const previousActiveAlertKeysRef = useRef<string | null>(null);

  const place = useMemo(() => {
    if (!id) {
      return null;
    }

    if (selectedPlace?._id === id) {
      return selectedPlace;
    }

    return places.find((entry) => entry._id === id) || null;
  }, [id, places, selectedPlace]);

  useEffect(() => {
    if (id) {
      dispatch(fetchPlaceById(id));
    }
  }, [dispatch, id]);

  const refreshPlace = useCallback(
    () => (id ? dispatch(fetchPlaceById(id)).unwrap() : Promise.resolve(null)),
    [dispatch, id]
  );

  const {
    isRefreshing: isRefreshingPlace,
    lastRefreshError: placeRefreshError,
    lastUpdatedAt: placeLastUpdatedAt,
    refreshNow: refreshPlaceNow,
  } = useRealtimeRefresh({
    enabled: Boolean(id),
    intervalMs: 30000,
    onRefresh: refreshPlace,
  });

  const accessibilityDetails = useMemo(
    () => normalizeAccessibilityDetails(place?.accessibilityDetails),
    [place?.accessibilityDetails]
  );

  const activeAlerts = useMemo(
    () => (place?.alerts || []).filter((alert) => alert.status === 'active'),
    [place?.alerts]
  );

  const activeAlertKeys = useMemo(
    () => activeAlerts.map(getAlertIdentity).join('|'),
    [activeAlerts]
  );

  const canResolveAlerts = Boolean(
    place &&
      (user?.role === 'admin' ||
        (typeof place.createdBy !== 'string' &&
          (place.createdBy._id === user?.id || place.createdBy.id === user?.id)))
  );

  const placeSummary = useMemo(() => {
    if (!place) {
      return 'Place details are still loading.';
    }

    const populatedCategories = (Object.keys(NEED_LABELS) as NeedCategory[])
      .filter((category) => accessibilityDetails[category].length > 0)
      .map(
        (category) =>
          `${NEED_LABELS[category]}: ${accessibilityDetails[category].slice(0, 3).join(', ')}`
      );

    const alertsSummary =
      activeAlerts.length > 0
        ? `${activeAlerts.length} active alert${activeAlerts.length > 1 ? 's' : ''} reported.`
        : 'No active alerts are currently reported.';

    return `${place.name} has an accessibility score of ${place.accessibilityScore} out of 100. ${alertsSummary} ${populatedCategories.slice(0, 3).join('. ')}.`;
  }, [accessibilityDetails, activeAlerts.length, place]);

  useEffect(() => {
    if (!place) {
      previousActiveAlertKeysRef.current = null;
      return;
    }

    const isVoiceModeEnabled = Boolean(user?.accessibilityProfile?.interaction?.voice);

    if (!isVoiceModeEnabled) {
      previousActiveAlertKeysRef.current = activeAlertKeys;
      return;
    }

    const previousActiveAlertKeys = previousActiveAlertKeysRef.current;

    if (previousActiveAlertKeys === null) {
      previousActiveAlertKeysRef.current = activeAlertKeys;
      return;
    }

    const previousKeys = new Set(previousActiveAlertKeys.split('|').filter(Boolean));
    const newAlerts = activeAlerts.filter(
      (alert, index) => !previousKeys.has(getAlertIdentity(alert, index))
    );

    previousActiveAlertKeysRef.current = activeAlertKeys;

    if (newAlerts.length > 0) {
      speakText(
        `New accessibility alert for ${place.name}: ${
          newAlerts[0].message || 'A temporary accessibility issue was reported.'
        }`
      );
    }
  }, [activeAlertKeys, activeAlerts, place, user?.accessibilityProfile?.interaction?.voice]);

  if (!place && isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center text-slate-500">
        Loading place details...
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Place not found</h1>
          <p className="mt-2 text-slate-600">
            The accessibility entry you requested is unavailable.
          </p>
          <Link
            to="/places"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to places
          </Link>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await dispatch(
      addReview({
        placeId: place._id,
        accessibilityRating,
        comment,
        issueFlags: issueFlags
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      })
    );

    setAccessibilityRating(5);
    setComment('');
    setIssueFlags('');
  };

  const handleReportAlert = async ({
    alertType,
    message,
  }: {
    alertType: string;
    message: string;
  }) => {
    await dispatch(addAlert({ placeId: place._id, alertType, message }));
  };

  const handleResolveAlert = async (alertId: string) => {
    await dispatch(resolveAlert({ placeId: place._id, alertId }));
  };

  const handleCreateReservation = async (payload: {
    reservationFor: string;
    guests: number;
    notes: string;
    accessibilitySupportNotes: string;
    ride: {
      required: boolean;
      provider: 'cab' | 'uber';
      pickupAddress: string;
      pickupTime: string;
      notes: string;
    };
  }) => {
    await dispatch(
      createReservation({
        placeId: place._id,
        ...payload,
      })
    ).unwrap();
  };

  const handleVoiceCommand = async (command: string) => {
    const normalized = command.toLowerCase().trim();

    if (!normalized) {
      return 'Try saying read details, read alerts, or read accessibility.';
    }

    if (normalized.includes('read details') || normalized.includes('read place')) {
      return placeSummary;
    }

    if (normalized.includes('read alerts')) {
      if (!activeAlerts.length) {
        return 'There are no active accessibility alerts for this place.';
      }

      return activeAlerts
        .slice(0, 3)
        .map((alert) => alert.message || 'A temporary accessibility issue is active.')
        .join(' ');
    }

    if (normalized.includes('read accessibility')) {
      const entries = (Object.keys(NEED_LABELS) as NeedCategory[])
        .filter((category) => accessibilityDetails[category].length > 0)
        .map(
          (category) =>
            `${NEED_LABELS[category]} support includes ${accessibilityDetails[category]
              .slice(0, 3)
              .join(', ')}`
        );

      return entries.length
        ? entries.join('. ')
        : 'No detailed accessibility features are listed yet.';
    }

    if (normalized.includes('navigate')) {
      return 'Use the accessible navigation panel to open Google Maps or OpenStreetMap directions.';
    }

    if (normalized.includes('refresh') || normalized.includes('update')) {
      const didRefresh = await refreshPlaceNow();
      return didRefresh
        ? 'This place has been refreshed with the latest accessibility alerts.'
        : 'I could not refresh this place just now. Please try again.';
    }

    if (normalized.includes('report alert')) {
      return 'Use the live accessibility alerts panel to report issues like a blocked ramp or broken lift.';
    }

    if (normalized.includes('book') || normalized.includes('reserve')) {
      return 'Use the booking section to reserve this place and request a pickup. You can then track confirmation replies in your dashboard.';
    }

    return placeSummary;
  };

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" to="/places">
          Back to discovery
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-72 bg-slate-100 md:h-full">
                  {place.images[0] ? (
                    <img
                      src={place.images[0]}
                      alt={place.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100">
                      <MapPin className="text-blue-600" size={32} />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                      {place.type}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        place.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {place.verificationStatus}
                    </span>
                  </div>

                  <h1 className="mt-4 text-3xl font-bold text-slate-900">
                    {place.name}
                  </h1>
                  <p className="mt-3 flex items-center gap-2 text-slate-600">
                    <MapPin size={16} />
                    {place.address}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {place.description}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Accessibility score
                      </div>
                      <div className="mt-2 text-3xl font-bold text-slate-900">
                        {place.accessibilityScore}/100
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Community rating
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
                        <Star size={20} className="text-amber-500" fill="currentColor" />
                        {place.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={15} />
                      {place.contact.phone || 'Phone not provided'}
                    </div>
                    {place.contact.email && <div>Email: {place.contact.email}</div>}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">
                Accessibility details
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(Object.keys(NEED_LABELS) as NeedCategory[]).map((category) => (
                  <div
                    key={category}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      {NEED_LABELS[category]}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {accessibilityDetails[category].length > 0 ? (
                        accessibilityDetails[category].map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {feature}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          No accessibility data reported yet.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <VoiceAssistant
              title="Voice guide"
              description="Listen to place details, accessibility features, and alert summaries using browser voice support."
              commandExamples={[
                'Read details',
                'Read accessibility',
                'Read alerts',
                'Refresh alerts',
                'Navigate there',
              ]}
              onCommand={handleVoiceCommand}
              getSummary={() => placeSummary}
            />

            <LiveRefreshStatus
              title="Live alert refresh"
              description="Huruspaces checks this place for new or resolved accessibility alerts every 30 seconds while this page is visible."
              isRefreshing={isRefreshingPlace}
              lastRefreshError={placeRefreshError}
              lastUpdatedAt={placeLastUpdatedAt}
              onRefresh={refreshPlaceNow}
            />

            <PlaceAlertsPanel
              place={place}
              canReport={Boolean(user)}
              canResolve={Boolean(canResolveAlerts)}
              onReportAlert={handleReportAlert}
              onResolveAlert={handleResolveAlert}
            />

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-blue-700" size={20} />
                <h2 className="text-2xl font-semibold text-slate-900">
                  Accessibility reviews
                </h2>
              </div>
              <div className="mt-6 space-y-4">
                {place.reviews.length > 0 ? (
                  place.reviews.map((review, index) => (
                    <div
                      key={review._id || `${place._id}-review-${index}`}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {typeof review.user === 'string'
                              ? 'Community member'
                              : review.user.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-900">
                          <Star size={14} className="text-amber-500" fill="currentColor" />
                          {review.accessibilityRating}/5
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {review.comment}
                        </p>
                      )}
                      {review.issueFlags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {review.issueFlags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                    No reviews yet. Share the real on-the-ground accessibility experience.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <AccessibilityMap
              places={[place]}
              highlightedPlaceId={place._id}
              title="Place map"
              description="View the reported place coordinates on OpenStreetMap."
            />

            <PlaceNavigationPanel
              place={place}
              profile={user?.accessibilityProfile || null}
            />

            {user ? (
              <ReservationForm
                placeName={place.name}
                defaultAccessibilitySupportNotes={
                  user.accessibilityProfile.needs.length
                    ? `Accessibility profile: ${user.accessibilityProfile.needs.join(', ')}`
                    : ''
                }
                defaultTransportRequirements={getTransportRequirements(
                  user.accessibilityProfile
                )}
                onSubmit={handleCreateReservation}
              />
            ) : (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Book and schedule pickup
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in to reserve this place, request pickup, and track confirmations from the place and transport desk.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  Sign in to book
                </Link>
              </section>
            )}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Add your accessibility review
                </h2>
              </div>
              {user ? (
                <form className="mt-6 space-y-4" onSubmit={handleReviewSubmit}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Accessibility rating
                    </span>
                    <select
                      value={accessibilityRating}
                      onChange={(event) => setAccessibilityRating(Number(event.target.value))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} / 5
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Real-world notes
                    </span>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="Example: Ramp exists, but it is too steep without assistance."
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Issue flags
                    </span>
                    <input
                      value={issueFlags}
                      onChange={(event) => setIssueFlags(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="Lift offline, blocked ramp, noisy entrance"
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Submit review
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                  Sign in to contribute reviews and help validate accessibility data.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Proof images</h2>
              <div className="mt-4 grid gap-3">
                {place.images.length > 0 ? (
                  place.images.map((image, index) => (
                    <img
                      key={`${place._id}-proof-${index}`}
                      src={image}
                      alt={`${place.name} proof ${index + 1}`}
                      className="h-40 w-full rounded-3xl object-cover"
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    No proof images uploaded yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;
