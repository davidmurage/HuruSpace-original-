import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BadgeCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import PlaceForm from '../components/PlaceForm';
import {
  createPlace,
  deletePlace,
  fetchPlaces,
  Place,
  updatePlace,
} from '../store/slices/placesSlice';
import { RootState, AppDispatch } from '../store/store';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { places, isLoading, error } = useSelector((state: RootState) => state.places);
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  useEffect(() => {
    dispatch(fetchPlaces());
  }, [dispatch]);

  const closeForm = () => {
    setShowForm(false);
    setEditingPlace(null);
  };

  const handleSubmit = async (formData: FormData) => {
    if (editingPlace) {
      await dispatch(updatePlace({ id: editingPlace._id, placeData: formData }));
    } else {
      await dispatch(createPlace(formData));
    }
    closeForm();
  };

  const handleDelete = async (placeId: string) => {
    if (window.confirm('Delete this place entry?')) {
      await dispatch(deletePlace(placeId));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin access required
          </h1>
          <p className="mt-2 text-slate-600">
            Verified partners and admins can manage community submissions here.
          </p>
          <Link
            to="/places"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin workspace</h1>
            <p className="mt-2 text-slate-600">
              Review community places, verify entries, and keep accessibility data trusted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus size={18} />
            Add place
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Places</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading places...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Place
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {places.map((place) => (
                    <tr key={place._id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900">{place.name}</div>
                          <div className="text-sm text-slate-500">{place.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-slate-700">
                        {place.type.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {place.accessibilityScore}/100
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            place.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <BadgeCheck size={13} />
                          {place.verificationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingPlace(place)}
                            className="rounded-full border border-slate-200 p-2 text-slate-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(place._id)}
                            className="rounded-full border border-red-200 p-2 text-red-600"
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

        {(showForm || editingPlace) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div className="w-full max-w-4xl">
              <PlaceForm
                place={editingPlace}
                allowVerification
                onSubmit={handleSubmit}
                onCancel={closeForm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
