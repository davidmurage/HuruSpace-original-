import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { clearError, login } from '../store/slices/authSlice';

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(clearError());

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      // Error is handled in Redux state.
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <img
            src="/WhatsApp Image 2025-06-30 at 12.26.36.jpeg"
            alt="HuruSpaces logo"
            className="mx-auto h-16 w-16 rounded-3xl object-cover"
          />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your accessibility profile and saved discovery flow.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4"
                placeholder="Enter your password"
              />
            </div>
          </label>

          <div className="text-right">
            <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{' '}
          <Link className="font-semibold text-blue-700 hover:text-blue-800" to="/register">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
