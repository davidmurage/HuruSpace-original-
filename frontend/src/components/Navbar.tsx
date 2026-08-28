import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Accessibility,
  Home,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const closeMenu = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/WhatsApp Image 2025-06-30 at 12.26.36.jpeg"
            alt="HuruSpaces logo"
            className="h-11 w-11 rounded-2xl object-cover"
          />
          <div>
            <span className="block text-lg font-bold text-slate-900">
              HuruSpaces
            </span>
            <span className="block text-xs text-slate-500">
              Inclusive place discovery
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link className="text-sm font-medium text-slate-600 hover:text-blue-700" to="/">
            Home
          </Link>
          <Link
            className="text-sm font-medium text-slate-600 hover:text-blue-700"
            to="/places"
          >
            Discover
          </Link>
          {user && user.role !== 'admin' && (
            <Link
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
              to="/dashboard"
            >
              Dashboard
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
              to="/admin"
            >
              Admin
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create profile
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border border-slate-200 p-2 text-slate-700 md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="space-y-2">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Home size={18} />
              Home
            </Link>
            <Link
              to="/places"
              onClick={closeMenu}
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <MapPinned size={18} />
              Discover spaces
            </Link>
            {user && user.role !== 'admin' && (
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                <ShieldCheck size={18} />
                Admin
              </Link>
            )}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {user ? (
              <>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Signed in as <span className="font-semibold">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid gap-3">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-full bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Create accessible profile
                </Link>
              </div>
            )}
            {!user && (
              <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex items-start gap-2">
                  <Accessibility className="mt-0.5" size={18} />
                  <p>
                    Create a profile to personalize results based on your
                    accessibility needs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
