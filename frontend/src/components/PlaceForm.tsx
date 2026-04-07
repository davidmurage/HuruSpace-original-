import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  ACCESSIBILITY_OPTIONS,
  PLACE_TYPES,
  emptyAccessibilityDetails,
  normalizeAccessibilityDetails,
} from '../constants/accessibility';
import { AccessibilityDetails, NeedCategory } from '../types/accessibility';
import { Place } from '../store/slices/placesSlice';

interface PlaceFormProps {
  place?: Place | null;
  allowVerification?: boolean;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({
  place,
  allowVerification = false,
  onSubmit,
  onCancel,
}) => {
  const [details, setDetails] = useState<AccessibilityDetails>(emptyAccessibilityDetails());
  const [images, setImages] = useState<File[]>([]);
  const [imageUrlsText, setImageUrlsText] = useState('');
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
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

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
      JSON.stringify({
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
      })
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

    onSubmit(payload);
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

        <div className="grid gap-4 md:grid-cols-2">
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
                Cloudinary uploads will work when backend image credentials are
                configured. External URLs can be added right away.
              </p>
            </div>
          </label>
        </div>

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
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {place ? 'Save changes' : 'Submit place'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceForm;
