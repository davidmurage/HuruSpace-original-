import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchPlaces, createPlace, updatePlace, deletePlace } from '../store/slices/placesSlice';
import PlaceForm from '../components/PlaceForm';
import { Plus, Edit, Trash2, Building2, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { places, isLoading } = useSelector((state: RootState) => state.places);
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);

  useEffect(() => {
    dispatch(fetchPlaces() as any);
  }, [dispatch]);

  const handleCreatePlace = (placeData: FormData) => {
    dispatch(createPlace(placeData) as any);
    setShowForm(false);
  };

  const handleUpdatePlace = (id: string, placeData: FormData) => {
    dispatch(updatePlace({ id, placeData }) as any);
    setEditingPlace(null);
  };

  const handleDeletePlace = (id: string) => {
    if (window.confirm('Are you sure you want to delete this place?')) {
      dispatch(deletePlace(id) as any);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage places and monitor platform activity</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add New Place</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Places</h3>
                <p className="text-2xl font-bold text-blue-600">{places.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Restaurants</h3>
                <p className="text-2xl font-bold text-green-600">
                  {places.filter(p => p.type === 'restaurant').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Building2 className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Offices</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {places.filter(p => p.type === 'office').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Places Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Manage Places</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading places...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {places.map((place) => (
                    <tr key={place._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{place.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          place.type === 'restaurant' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {place.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {place.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {place.rating.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingPlace(place)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePlace(place._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Place Form Modal */}
        {(showForm || editingPlace) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <PlaceForm
                place={editingPlace}
                onSubmit={editingPlace ? 
                  (data) => handleUpdatePlace(editingPlace._id, data) : 
                  handleCreatePlace
                }
                onCancel={() => {
                  setShowForm(false);
                  setEditingPlace(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;