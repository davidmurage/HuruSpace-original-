import React, { useMemo, useState } from 'react';
import { CalendarClock, CarFront, CheckCircle2 } from 'lucide-react';
import { TRANSPORT_ACCESSIBILITY_OPTIONS } from '../constants/accessibility';

interface ReservationRideInput {
  required: boolean;
  provider: 'cab' | 'uber';
  pickupAddress: string;
  pickupTime: string;
  notes: string;
  accessibilityRequirements: string[];
}

interface ReservationPayload {
  reservationFor: string;
  guests: number;
  notes: string;
  accessibilitySupportNotes: string;
  ride: ReservationRideInput;
}

interface ReservationFormProps {
  placeName: string;
  defaultAccessibilitySupportNotes?: string;
  defaultTransportRequirements?: string[];
  onSubmit: (payload: ReservationPayload) => Promise<void>;
}

const toDateTimeInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const buildDefaultReservationTime = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toDateTimeInputValue(date);
};

const buildSuggestedPickupTime = (reservationFor: string) => {
  const date = new Date(reservationFor);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setMinutes(date.getMinutes() - 45);
  return toDateTimeInputValue(date);
};

const ReservationForm: React.FC<ReservationFormProps> = ({
  placeName,
  defaultAccessibilitySupportNotes = '',
  defaultTransportRequirements = [],
  onSubmit,
}) => {
  const defaultReservationTime = useMemo(buildDefaultReservationTime, []);
  const [reservationFor, setReservationFor] = useState(defaultReservationTime);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [accessibilitySupportNotes, setAccessibilitySupportNotes] = useState(
    defaultAccessibilitySupportNotes
  );
  const [ride, setRide] = useState<ReservationRideInput>({
    required: false,
    provider: 'cab',
    pickupAddress: '',
    pickupTime: buildSuggestedPickupTime(defaultReservationTime),
    notes: '',
    accessibilityRequirements: defaultTransportRequirements,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleReservationTimeChange = (value: string) => {
    setReservationFor(value);
    setRide((current) => ({
      ...current,
      pickupTime: current.pickupTime ? current.pickupTime : buildSuggestedPickupTime(value),
    }));
  };

  const handleRideToggle = (required: boolean) => {
    setRide((current) => ({
      ...current,
      required,
      pickupTime:
        required && !current.pickupTime
          ? buildSuggestedPickupTime(reservationFor)
          : current.pickupTime,
    }));
  };

  const toggleTransportRequirement = (requirement: string) => {
    setRide((current) => ({
      ...current,
      accessibilityRequirements: current.accessibilityRequirements.includes(requirement)
        ? current.accessibilityRequirements.filter((entry) => entry !== requirement)
        : [...current.accessibilityRequirements, requirement],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        reservationFor,
        guests,
        notes,
        accessibilitySupportNotes,
        ride,
      });

      setStatusMessage(
        `Reservation sent for ${placeName}. The place has received it${ride.required ? ' and your ride request has been received too' : ''}.`
      );
      setNotes('');
      setRide((current) => ({
        ...current,
        pickupAddress: '',
        pickupTime: buildSuggestedPickupTime(reservationFor),
        notes: '',
        accessibilityRequirements: defaultTransportRequirements,
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Reservation could not be created right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <CalendarClock className="text-blue-700" size={22} />
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Book this place and schedule pickup
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Reserve your visit, then track the place and ride confirmations from the dashboard.
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Reservation time</span>
            <input
              type="datetime-local"
              value={reservationFor}
              onChange={(event) => handleReservationTimeChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Guests</span>
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value) || 1)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Accessibility support notes</span>
          <textarea
            rows={3}
            value={accessibilitySupportNotes}
            onChange={(event) => setAccessibilitySupportNotes(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Share the support you will need on arrival, seating, entrance, or navigation."
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Reservation notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Optional notes for your visit."
          />
        </label>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CarFront className="mt-0.5 text-emerald-700" size={20} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Ride scheduling</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Save a pickup plan together with your reservation so the transport desk can confirm it.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={ride.required}
                    onChange={(event) => handleRideToggle(event.target.checked)}
                  />
                  Schedule a ride
                </label>
              </div>

              {ride.required && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Ride provider</span>
                    <select
                      value={ride.provider}
                      onChange={(event) =>
                        setRide((current) => ({
                          ...current,
                          provider: event.target.value === 'uber' ? 'uber' : 'cab',
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <option value="cab">Cab</option>
                      <option value="uber">Uber preference</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Pickup time</span>
                    <input
                      type="datetime-local"
                      value={ride.pickupTime}
                      onChange={(event) =>
                        setRide((current) => ({
                          ...current,
                          pickupTime: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      required={ride.required}
                    />
                  </label>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Pickup address</span>
                    <input
                      value={ride.pickupAddress}
                      onChange={(event) =>
                        setRide((current) => ({
                          ...current,
                          pickupAddress: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="Where the driver should pick you up"
                      required={ride.required}
                    />
                  </label>

                  <fieldset className="md:col-span-2">
                    <legend className="text-sm font-medium text-slate-700">
                      Transport accessibility requirements
                    </legend>
                    <p className="mt-1 text-xs text-slate-500">
                      These are shared with the transport provider so they can assign a suitable vehicle and driver.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TRANSPORT_ACCESSIBILITY_OPTIONS.map((requirement) => {
                        const selected = ride.accessibilityRequirements.includes(requirement);

                        return (
                          <button
                            key={requirement}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleTransportRequirement(requirement)}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              selected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                            }`}
                          >
                            {requirement}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Ride notes</span>
                    <textarea
                      rows={3}
                      value={ride.notes}
                      onChange={(event) =>
                        setRide((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="Optional pickup instructions, landmark notes, or mobility support details."
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Scheduling reservation...' : 'Book visit and ride'}
        </button>
      </form>
    </section>
  );
};

export default ReservationForm;
