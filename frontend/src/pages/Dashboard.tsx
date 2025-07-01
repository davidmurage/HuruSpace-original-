import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { User, MapPin, Heart, Settings } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your HuruSpaces experience from your personal dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-gray-600">Manage your account</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Email:</span> {user.email}</p>
              <p className="text-sm"><span className="font-medium">Role:</span> {user.role}</p>
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Edit Profile
            </button>
          </div>

          {/* Saved Places */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Heart className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Places</h3>
                <p className="text-gray-600">Your favorite locations</p>
              </div>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500">No saved places yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start exploring to save your favorite accessible places
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <MapPin className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-gray-600">Your latest interactions</p>
              </div>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                Your activity will appear here
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-3 rounded-full">
                <Settings className="text-gray-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <p className="text-gray-600">Customize your experience</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                Notification Preferences
              </button>
              <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                Accessibility Settings
              </button>
              <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                Privacy Settings
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-50 text-blue-700 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors">
                Find Nearby Places
              </button>
              <button className="bg-green-50 text-green-700 py-3 px-4 rounded-lg hover:bg-green-100 transition-colors">
                Browse Restaurants
              </button>
              <button className="bg-purple-50 text-purple-700 py-3 px-4 rounded-lg hover:bg-purple-100 transition-colors">
                Explore Offices
              </button>
              <button className="bg-orange-50 text-orange-700 py-3 px-4 rounded-lg hover:bg-orange-100 transition-colors">
                Leave a Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;