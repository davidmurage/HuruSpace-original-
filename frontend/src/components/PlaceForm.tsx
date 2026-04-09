import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import {
  ACCESSIBILITY_OPTIONS,
  PLACE_TYPES,
  emptyAccessibilityDetails,
  normalizeAccessibilityDetails,
} from '../constants/accessibility';
import { AccessibilityDetails, NeedCategory } from '../types/accessibility';
import { Place } from '../store/slices/placesSlice';
import { geocodeAddress, GeocodingResult } from '../utils/geocoding';
import { hasCoordinates } from '../utils/location';

interface PlaceFormProps {
  place?: Place | null;
  allowVerification?: boolean;
  onSubmit: (data: FormData) => Promise<void> | void;
  onCancel: () => void;
}

const getSubmitErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Place could not be saved. Please check the form and try again.';
};

const PlaceForm: React.FC<PlaceFormProps> = ({
  place,
  allowVerification = false,
  onSubmit,
  onCancel,
}) => {
  const [details, setDetails] = useState<AccessibilityDetails>(emptyAccessibilityDetails());
  const [images, setImages] = useState<File[]>([]);
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocodingMessage, setGeocodingMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [lastResolvedAddress, setLastResolvedAddress] = useState('');
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    address: '',
    description: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    verificationStatus: 'community',
  });

  useEffect(() => {
    if (!place) {
      return;
    }

    setDetails(normalizeAccessibilityDetails(place.accessibilityDetails));
    setImageUrlsText(place.images.join('\n'));
    setLastResolvedAddress(place.address || '');
    setGeocodingMessage(
      hasCoordinates(place.location)
        ? 'Coordinates are already saved for this place.'
        : 'Use the address lookup to fetch coordinates for this place.'
    );
    setFormData({
      name: place.name || '',
      type: place.type || 'restaurant',
      address: place.address || '',
      description: place.description || '',
      phone: place.contact?.phone || '',
      email: place.contact?.email || '',
      latitude: place.location?.latitude?.toString() || '',
      longitude: place.location?.longitude?.toString() || '',
      verificationStatus: place.verificationStatus || 'community',
    });
  }, [place]);

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === 'address') {
      setLastResolvedAddress('');
      setGeocodingMessage('Coordinates will be looked up from this address.');
    }
  };

  const applyGeocodingResult = (result: GeocodingResult, sourceAddress: string) => {
    setFormData((current) => ({
      ...current,
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString(),
    }));
    setLastResolvedAddress(sourceAddress.trim());
    setGeocodingMessage(`Coordinates found for: ${result.displayName}`);
  };

  const lookupAddressCoordinates = async () => {
    const sourceAddress = formData.address.trim();

    if (!sourceAddress) {
      setGeocodingMessage('Enter an address before finding coordinates.');
      return null;
    }

    setIsGeocoding(true);
    setGeocodingMessage('Finding coordinates from the address...');

    try {
      const result = await geocodeAddress(sourceAddress);

      if (!result) {
        setGeocodingMessage(
          'No coordinates were found for that address. Try adding the city, country, or a nearby landmark.'
        );
        return null;
      }

      applyGeocodingResult(result, sourceAddress);
      return result;
    } catch (error) {
      setGeocodingMessage(
        error instanceof Error
          ? error.message
          : 'Address lookup failed. Please try again.'
      );
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFeatureToggle = (category: NeedCategory, option: string) => {
    const currentValues = details[category];
    const nextValues = currentValues.includes(option)
      ? currentValues.filter((entry) => entry !== option)
      : [...currentValues, option];

    setDetails((current) => ({
      ...current,
      [category]: nextValues,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    const normalizedAddress = formData.address.trim();
    const currentCoordinates = {
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
    };
    const canUseCurrentCoordinates =
      hasCoordinates(currentCoordinates) &&
      (showManualCoordinates || lastResolvedAddress === normalizedAddress);
    let resolvedCoordinates = canUseCurrentCoordinates
      ? currentCoordinates
      : await lookupAddressCoordinates();

    if (!resolvedCoordinates) {
      setGeocodingMessage(
        'Browser address lookup did not find coordinates. The server will try one more lookup before saving.'
      );
      resolvedCoordinates = null;
    }

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('type', formData.type);
    payload.append('address', formData.address);
    payload.append('description', formData.description);
    payload.append(
      'contact',
      JSON.stringify({
        phone: formData.phone,
        email: formData.email,
      })
    );
    payload.append(
      'location',
      JSON.stringify(
        resolvedCoordinates
          ? {
              latitude: resolvedCoordinates.latitude,
              longitude: resolvedCoordinates.longitude,
            }
          : {}
      )
    );
    payload.append('accessibilityDetails', JSON.stringify(details));
    payload.append(
      'imageUrls',
      JSON.stringify(
        imageUrlsText
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
      )
    );
    payload.append('verificationStatus', formData.verificationStatus);

    images.forEach((image) => payload.append('images', image));

    setIsSubmitting(true);

    try {
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {place ? 'Update accessibility data' : 'Add an accessible place'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Share location details, accessibility features, and proof links so
            the community can navigate with confidence.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 p-2 text-slate-500"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Place name</span>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Westlands community cafe"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Place type</span>
            <select
              name="type"
              value={formData.type}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 capitalize"
            >
              {PLACE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('-', ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Address</span>
          <input
            required
            name="address"
            value={formData.address}
            onChange={handleFieldChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Street, city, and landmark"
          />
          <span className="block text-xs font-normal text-slate-500">
            Add a complete address. Huruspaces will fetch latitude and longitude automatically.
          </span>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Description</span>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleFieldChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Describe access points, toilets, entrances, and real-world conditions."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Phone</span>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="+254..."
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="hello@place.com"
            />
          </label>
        </div>

        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-900">
                <MapPin size={18} />
                <h3 className="text-lg font-semibold">Map coordinates</h3>
              </div>
              <p className="mt-2 text-sm text-blue-900">
                Coordinates are generated from the address, so contributors do not
                need to enter latitude and longitude manually.
              </p>
              {geocodingMessage && (
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {geocodingMessage}
                </p>
              )}
              {hasCoordinates({
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
              }) && (
                <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                  Lat {Number(formData.latitude).toFixed(6)}, Long{' '}
                  {Number(formData.longitude).toFixed(6)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void lookupAddressCoordinates()}
                disabled={isGeocoding || !formData.address.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isGeocoding && <Loader2 size={16} className="animate-spin" />}
                {isGeocoding ? 'Finding...' : 'Find coordinates'}
              </button>
              <button
                type="button"
                onClick={() => setShowManualCoordinates((current) => !current)}
                className="rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-800"
              >
                {showManualCoordinates ? 'Hide manual fields' : 'Edit manually'}
              </button>
            </div>
          </div>

          {showManualCoordinates && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Latitude</span>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleFieldChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="-1.286389"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Longitude</span>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleFieldChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="36.817223"
                />
              </label>
            </div>
          )}
        </section>

        {allowVerification && (
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Verification status</span>
            <select
              name="verificationStatus"
              value={formData.verificationStatus}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="community">Community reported</option>
              <option value="verified">Verified</option>
            </select>
          </label>
        )}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Accessibility Features by Category
          </h3>
          <div className="mt-4 space-y-4">
            {(Object.keys(ACCESSIBILITY_OPTIONS) as NeedCategory[]).map((category) => (
              <div key={category}>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {category}
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ACCESSIBILITY_OPTIONS[category].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleFeatureToggle(category, option)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        details[category].includes(option)
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Proof image URLs</span>
            <textarea
              rows={4}
              value={imageUrlsText}
              onChange={(event) => setImageUrlsText(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="One image URL per line"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Upload new images</span>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) =>
                  setImages(event.target.files ? Array.from(event.target.files) : [])
                }
                className="w-full text-sm text-slate-600"
              />
              <p className="mt-3 text-xs text-slate-500">
                Uploaded images use Cloudinary when configured, with a local
                development fallback. External URLs can be added right away.
              </p>
            </div>
          </label>
        </div>

        {submitError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isGeocoding || isSubmitting}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isGeocoding || isSubmitting
              ? isGeocoding
                ? 'Finding coordinates...'
                : 'Saving place...'
              : place
                ? 'Save changes'
                : 'Submit place'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceForm;
