import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  MessageSquare,
  Phone,
  Star,
} from 'lucide-react';
import {
  flattenAccessibilityDetails,
  normalizeAccessibilityDetails,
} from '../constants/accessibility';
import { Place } from '../store/slices/placesSlice';

interface PlaceCardProps {
  place: Place;
  distanceLabel?: string | null;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, distanceLabel }) => {
  const accessibilityDetails = normalizeAccessibilityDetails(place.accessibilityDetails);
  const features =
    place.accessibilityFeatures.length > 0
      ? place.accessibilityFeatures
      : flattenAccessibilityDetails(accessibilityDetails);
  const activeCategories = Object.entries(accessibilityDetails).filter(
    ([, value]) => value.length > 0
  );
  const activeAlerts = place.alerts.filter((alert) => alert.status === 'active');

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-52 bg-slate-100">
        {place.images[0] ? (
          <img
            src={place.images[0]}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 via-white to-emerald-100">
            <div className="rounded-full bg-white p-5 shadow-sm">
              <MapPin className="text-blue-600" size={28} />
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
            {place.type}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              place.verificationStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {place.verificationStatus === 'verified' ? 'Verified' : 'Community'}
          </span>
          {activeAlerts.length > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {activeAlerts.length} alert{activeAlerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 rounded-2xl bg-slate-900/85 px-3 py-2 text-right text-white">
          <div className="text-xs uppercase text-slate-300">Accessibility</div>
          <div className="text-lg font-bold">{place.accessibilityScore}/100</div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{place.name}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={15} />
              {place.address}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-amber-500">
              <Star size={16} fill="currentColor" />
              <span className="text-sm font-semibold text-slate-900">
                {place.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
              <MessageSquare size={13} />
              {place.reviews.length} reviews
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {place.description || 'Community-contributed accessibility details available.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {features.slice(0, 4).map((feature) => (
            <span
              key={feature}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {feature}
            </span>
          ))}
          {features.length > 4 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              +{features.length - 4} more
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {activeCategories.map(([category, values]) => (
            <span
              key={category}
              className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              <BadgeCheck size={13} />
              {category} ({values.length})
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="space-y-1 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Phone size={14} />
              {place.contact.phone || 'Contact not provided'}
            </div>
            {distanceLabel && (
              <div className="text-xs font-medium text-blue-700">
                {distanceLabel} away
              </div>
            )}
          </div>
          <Link
            to={`/places/${place._id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            View details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
