import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import AccessibilityProfileForm from '../components/AccessibilityProfileForm';
import { emptyAccessibilityProfile } from '../constants/accessibility';
import { RootState, AppDispatch } from '../store/store';
import { clearError, register } from '../store/slices/authSlice';

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [accessibilityProfile, setAccessibilityProfile] = useState(
    emptyAccessibilityProfile()
  );
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await dispatch(
        register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          accessibilityProfile,
        })
      ).unwrap();
      navigate('/dashboard');
    } catch {
      // Redux keeps server errors.
    }
  };

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Create your Huruspaces profile
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-600">
            Start with your identity and accessibility preferences so discovery
            feels practical from the first search.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
        >
          {(error || localError) && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError || error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  required
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4"
                  placeholder="Your name"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4"
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, password: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Minimum 6 characters"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Confirm password</span>
              <input
                required
                type="password"
                value={formData.confirmPassword}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Re-enter password"
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck size={16} />
                Account type
              </span>
              <select
                value={formData.role}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, role: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <option value="user">Community user</option>
                <option value="admin">Admin or verified partner</option>
              </select>
            </label>
          </div>

          <div className="mt-8">
            <AccessibilityProfileForm
              value={accessibilityProfile}
              onChange={setAccessibilityProfile}
            />
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link className="font-semibold text-blue-700 hover:text-blue-800" to="/login">
                Sign in
              </Link>
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={18} />
              {isLoading ? 'Creating profile...' : 'Create profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
