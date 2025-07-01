import React from 'react';
import { Place } from '../store/slices/placesSlice';
import { MapPin, Phone, Mail, Star, Accessibility } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {place.images && place.images.length > 0 ? (
          <img
            src={place.images[0]}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
            <Accessibility className="text-blue-600" size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            place.type === 'restaurant' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{place.name}</h3>
        
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{place.address}</span>
        </div>

        <div className="flex items-center mb-3">
          <Star className="text-yellow-400 mr-1" size={16} />
          <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {place.description}
        </p>

        {/* Accessibility Features */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Accessibility Features:</h4>
          <div className="flex flex-wrap gap-1">
            {place.accessibilityFeatures.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {feature}
              </span>
            ))}
            {place.accessibilityFeatures.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{place.accessibilityFeatures.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {place.contact.phone && (
              <div className="flex items-center">
                <Phone size={14} className="mr-1" />
                <span>{place.contact.phone}</span>
              </div>
            )}
            {place.contact.email && (
              <div className="flex items-center">
                <Mail size={14} className="mr-1" />
                <span>{place.contact.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;