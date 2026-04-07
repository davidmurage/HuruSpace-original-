import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Compass, Settings2, Sparkles, UserCircle2 } from 'lucide-react';
import AccessibilityProfileForm from '../components/AccessibilityProfileForm';
import { getPreferredFeatures } from '../constants/accessibility';
import { updateProfile } from '../store/slices/authSlice';
import { fetchPlaces } from '../store/slices/placesSlice';
import { RootState, AppDispatch } from '../store/store';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { places } = useSelector((state: RootState) => state.places);
  const [name, setName] = useState(user?.name || '');
  const [profile, setProfile] = useState(user?.accessibilityProfile || null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setProfile(user.accessibilityProfile);
      dispatch(fetchPlaces());
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
