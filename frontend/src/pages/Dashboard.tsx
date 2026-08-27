import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Compass,
  Settings2,
  Sparkles,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import AccessibilityProfileForm from '../components/AccessibilityProfileForm';
import ReservationStatusBadge from '../components/ReservationStatusBadge';
import { getPreferredFeatures } from '../constants/accessibility';
import { updateProfile } from '../store/slices/authSlice';
import { fetchPlaces } from '../store/slices/placesSlice';
import {
  cancelReservation,
  fetchManagedReservations,
  fetchMyReservations,
  Reservation,
  respondToReservation,
} from '../store/slices/reservationsSlice';
import { RootState, AppDispatch } from '../store/store';

const formatReservationDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const getRideSummary = (reservation: Reservation) => {
  if (!reservation.ride.required) {
    return 'No ride requested';
  }

  return `${
    reservation.ride.provider === 'uber' ? 'Uber request' : 'Cab request'
  } for ${formatReservationDateTime(
    reservation.ride.pickupTime || reservation.reservationFor
  )}`;
};

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { places } = useSelector((state: RootState) => state.places);
  const {
    reservations,
    managedReservations,
    isLoading: reservationsLoading,
    isManaging,
    error: reservationsError,
    managementError,
  } = useSelector((state: RootState) => state.reservations);
  const [name, setName] = useState(user?.name || '');
  const [profile, setProfile] = useState(user?.accessibilityProfile || null);
  const [statusMessage, setStatusMessage] = useState('');
  const [ownerResponseDrafts, setOwnerResponseDrafts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setProfile(user.accessibilityProfile);
      dispatch(fetchPlaces());
      dispatch(fetchMyReservations());
      dispatch(fetchManagedReservations());
    }
  }, [dispatch, user]);

  const contributedPlaces = useMemo(() => {
    if (!user) {
      return 0;
    }

    return places.filter((place) => {
      if (typeof place.createdBy === 'string') {
        return place.createdBy === user.id;
      }

      return place.createdBy._id === user.id || place.createdBy.id === user.id;
    }).length;
  }, [places, user]);

  const upcomingReservations = useMemo(
    () =>
      reservations
        .filter(
          (reservation) =>
            !['cancelled', 'declined', 'completed'].includes(reservation.status) &&
            new Date(reservation.reservationFor) > new Date()
        )
        .sort(
          (left, right) =>
            new Date(left.reservationFor).getTime() -
            new Date(right.reservationFor).getTime()
        ),
    [reservations]
  );

  const ownerInbox = useMemo(
    () =>
      managedReservations
        .filter(
          (reservation) =>
            !['cancelled', 'completed'].includes(reservation.status)
        )
        .sort(
          (left, right) =>
            new Date(left.reservationFor).getTime() -
            new Date(right.reservationFor).getTime()
        ),
    [managedReservations]
  );

  const canManagePlaces = useMemo(
    () => Boolean(user?.role === 'admin' || contributedPlaces > 0 || ownerInbox.length > 0),
    [contributedPlaces, ownerInbox.length, user?.role]
  );

  if (!user || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to access your dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Your profile powers personalized accessibility discovery.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage('');

    try {
      await dispatch(updateProfile({ name, accessibilityProfile: profile })).unwrap();
      setStatusMessage('Profile updated successfully.');
    } catch {
      setStatusMessage('Unable to save profile right now.');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await dispatch(cancelReservation(reservationId)).unwrap();
      setStatusMessage('Reservation cancelled.');
    } catch {
      setStatusMessage('Unable to cancel that reservation right now.');
    }
  };

  const handleOwnerResponse = async (
    reservationId: string,
    responseStatus: 'confirmed' | 'declined'
  ) => {
    try {
      await dispatch(
        respondToReservation({
          reservationId,
          status: responseStatus,
          message: ownerResponseDrafts[reservationId] || '',
        })
      ).unwrap();

      setOwnerResponseDrafts((current) => ({
        ...current,
        [reservationId]: '',
      }));
      setStatusMessage('Reservation response sent.');
    } catch {
      setStatusMessage('Unable to send that reservation response right now.');
    }
  };

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <UserCircle2 size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {user.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                  <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                    {user.role}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 text-blue-700">
                  <Sparkles size={20} />
                  <h2 className="font-semibold text-slate-900">Profile signal</h2>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {user.accessibilityProfile.needs.length}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  active accessibility need categories
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Compass size={20} />
                  <h2 className="font-semibold text-slate-900">Community input</h2>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {contributedPlaces}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  places contributed by your account
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 text-violet-700">
                  <CalendarClock size={20} />
                  <h2 className="font-semibold text-slate-900">Upcoming bookings</h2>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {upcomingReservations.length}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  bookings waiting for or holding confirmations
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Settings2 className="text-violet-700" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Current personalization
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.accessibilityProfile.needs.map((need) => (
                  <span
                    key={need}
                    className="rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                  >
                    {need}
                  </span>
                ))}
                {user.accessibilityProfile.needs.length === 0 && (
                  <span className="text-sm text-slate-500">
                    No categories selected yet.
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {getPreferredFeatures(user.accessibilityProfile).slice(0, 8).map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              <Link
                to="/places"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Explore with this profile
              </Link>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarClock className="text-blue-700" size={20} />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">My reservations</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Follow what the place owner and transport desk have sent back to you.
                  </p>
                </div>
              </div>

              {reservationsError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reservationsError}
                </div>
              )}

              <div className="mt-5 space-y-4">
                {reservationsLoading ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Loading your reservations...
                  </div>
                ) : upcomingReservations.length > 0 ? (
                  upcomingReservations.map((reservation) => {
                    const placeName =
                      !reservation.place || typeof reservation.place === 'string'
                        ? 'Reserved place'
                        : reservation.place.name;
                    const placeAddress =
                      !reservation.place || typeof reservation.place === 'string'
                        ? ''
                        : reservation.place.address;

                    return (
                      <div
                        key={reservation._id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {placeName}
                              </h3>
                              <ReservationStatusBadge status={reservation.status} />
                            </div>
                            {placeAddress && (
                              <p className="text-sm text-slate-600">{placeAddress}</p>
                            )}
                            <p className="text-sm font-medium text-slate-700">
                              Visit: {formatReservationDateTime(reservation.reservationFor)}
                            </p>
                            <p className="text-sm text-slate-600">Guests: {reservation.guests}</p>
                            <p className="text-sm text-slate-600">
                              Ride: {getRideSummary(reservation)}
                            </p>
                            {reservation.ride.required && reservation.ride.pickupAddress && (
                              <p className="text-sm text-slate-600">
                                Pickup from: {reservation.ride.pickupAddress}
                              </p>
                            )}
                            {reservation.ride.required &&
                              reservation.ride.accessibilityRequirements.length > 0 && (
                                <p className="text-sm text-slate-600">
                                  Transport requirements:{' '}
                                  {reservation.ride.accessibilityRequirements.join(', ')}
                                </p>
                              )}
                            {reservation.accessibilitySupportNotes && (
                              <p className="text-sm text-slate-600">
                                Accessibility notes: {reservation.accessibilitySupportNotes}
                              </p>
                            )}
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">Place reply</span>
                                <ReservationStatusBadge
                                  status={reservation.ownerResponse.status}
                                />
                              </div>
                              <p className="mt-2">
                                {reservation.ownerResponse.message || 'No owner reply yet.'}
                              </p>
                            </div>
                            {reservation.ride.required && (
                              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">Ride reply</span>
                                  <ReservationStatusBadge status={reservation.ride.status} />
                                </div>
                                <p className="mt-2">
                                  {reservation.ride.statusMessage ||
                                    'Your ride request has been logged.'}
                                </p>
                                {(reservation.ride.driverName ||
                                  reservation.ride.vehicleDetails ||
                                  reservation.ride.vehicleAccessibility.length > 0) && (
                                  <div className="mt-3 space-y-1 text-slate-600">
                                    {reservation.ride.driverName && (
                                      <p>
                                        Driver: {reservation.ride.driverName}
                                        {reservation.ride.driverPhone
                                          ? ` (${reservation.ride.driverPhone})`
                                          : ''}
                                      </p>
                                    )}
                                    {reservation.ride.vehicleDetails && (
                                      <p>Vehicle: {reservation.ride.vehicleDetails}</p>
                                    )}
                                    {reservation.ride.vehicleAccessibility.length > 0 && (
                                      <p>
                                        Vehicle access: {reservation.ride.vehicleAccessibility.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCancelReservation(reservation._id)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                          >
                            <XCircle size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    You do not have any active upcoming reservations yet. Book a place from the discovery page to schedule a visit and pickup.
                  </div>
                )}
              </div>
            </section>

            {canManagePlaces && (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <CalendarClock className="text-emerald-700" size={20} />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Reservation inbox for your places
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Reply to people who booked places you manage so they know whether the visit is confirmed.
                    </p>
                  </div>
                </div>

                {managementError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {managementError}
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  {isManaging && ownerInbox.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                      Loading reservation inbox...
                    </div>
                  ) : ownerInbox.length > 0 ? (
                    ownerInbox.map((reservation) => {
                      const bookedBy =
                        !reservation.user || typeof reservation.user === 'string'
                          ? 'Community member'
                          : reservation.user.name;
                      const contactEmail =
                        !reservation.user || typeof reservation.user === 'string'
                          ? ''
                          : reservation.user.email;
                      const managedPlaceName =
                        !reservation.place || typeof reservation.place === 'string'
                          ? 'Managed place'
                          : reservation.place.name;
                      const isClosed = ['declined', 'cancelled', 'completed'].includes(
                        reservation.status
                      );

                      return (
                        <div
                          key={reservation._id}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {managedPlaceName}
                                </h3>
                                <ReservationStatusBadge status={reservation.status} />
                              </div>
                              <p className="mt-1 text-sm text-slate-600">
                                Requested by {bookedBy}
                                {contactEmail ? ` (${contactEmail})` : ''}
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                Visit: {formatReservationDateTime(reservation.reservationFor)}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Guests: {reservation.guests}
                              </p>
                            </div>
                            {reservation.ride.required && (
                              <ReservationStatusBadge
                                status={reservation.ride.status}
                                label={`Ride ${reservation.ride.status}`}
                              />
                            )}
                          </div>

                          {reservation.accessibilitySupportNotes && (
                            <p className="mt-4 text-sm text-slate-600">
                              Accessibility needs: {reservation.accessibilitySupportNotes}
                            </p>
                          )}
                          {reservation.notes && (
                            <p className="mt-2 text-sm text-slate-600">
                              Reservation notes: {reservation.notes}
                            </p>
                          )}

                          <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">Current reply</span>
                              <ReservationStatusBadge
                                status={reservation.ownerResponse.status}
                              />
                            </div>
                            <p className="mt-2">
                              {reservation.ownerResponse.message || 'No reply sent yet.'}
                            </p>
                          </div>

                          {!isClosed && (
                            <div className="mt-4 space-y-3">
                              <textarea
                                rows={3}
                                value={ownerResponseDrafts[reservation._id] || ''}
                                onChange={(event) =>
                                  setOwnerResponseDrafts((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Add a note for the guest before confirming or declining."
                              />
                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOwnerResponse(reservation._id, 'confirmed')
                                  }
                                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                                >
                                  {reservation.status === 'confirmed'
                                    ? 'Update confirmation'
                                    : 'Confirm reservation'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOwnerResponse(reservation._id, 'declined')
                                  }
                                  className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700"
                                >
                                  Decline reservation
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                      No reservation requests have come in for your places yet.
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Edit accessibility profile
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This controls filters, interface modes, and how Huruspaces surfaces
              relevant access information.
            </p>

            <form className="mt-6 space-y-6" onSubmit={handleSave}>
              {statusMessage && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {statusMessage}
                </div>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Display name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>

              <AccessibilityProfileForm value={profile} onChange={setProfile} />

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
