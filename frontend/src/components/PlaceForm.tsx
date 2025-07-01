import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin } from 'lucide-react';

interface PlaceFormProps {
  place?: any;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({ place, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    address: '',
    description: '',
    accessibilityFeatures: [],
    phone: '',
    email: '',
    latitude: '',
    longitude: ''
  });
  const [images, setImages] = useState<File[]>([]);

  const accessibilityOptions = [
    'Wheelchair Accessible',
    'Braille Signage',
    'Audio Assistance',
    'Sign Language Support',
    'Accessible Parking',
    'Accessible Restrooms',
    'Elevator Access',
    'Wide Doorways',
    'Accessible Seating',
    'Service Animal Friendly'
  ];

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || '',
        type: place.type || 'restaurant',
        address: place.address || '',
        description: place.description || '',
        accessibilityFeatures: place.accessibilityFeatures || [],
        phone: place.contact?.phone || '',
        email: place.contact?.email || '',
        latitude: place.location?.latitude?.toString() || '',
        longitude: place.location?.longitude?.toString() || ''
      });
    }
  }, [place]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = formData.accessibilityFeatures.includes(feature)
      ? formData.accessibilityFeatures.filter(f => f !== feature)
      : [...formData.accessibilityFeatures, feature];
    
    setFormData({
      ...formData,
      accessibilityFeatures: newFeatures
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('type', formData.type);
    submitData.append('address', formData.address);
    submitData.append('description', formData.description);
    submitData.append('accessibilityFeatures', JSON.stringify(formData.accessibilityFeatures));
    submitData.append('contact', JSON.stringify({
      phone: formData.phone,
      email: formData.email
    }));
    submitData.append('location', JSON.stringify({
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0
    }));

    images.forEach((image) => {
      submitData.append('images', image);
    });

    onSubmit(submitData);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {place ? 'Edit Place' : 'Add New Place'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter place name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="restaurant">Restaurant</option>
              <option value="office">Office</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            name="address"
            required
            value={formData.address}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the place and its accessibility features"
          />
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter latitude"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter longitude"
            />
          </div>
        </div>

        {/* Accessibility Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Accessibility Features
          </label>
          <div className="grid md:grid-cols-2 gap-2">
            {accessibilityOptions.map((feature) => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.accessibilityFeatures.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-600 mb-2">
              Upload images of the place (max 5 images)
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Choose Images
            </label>
            {images.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {images.length} image(s) selected
              </p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {place ? 'Update Place' : 'Create Place'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceForm;