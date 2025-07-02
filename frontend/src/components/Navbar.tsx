import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { Menu, User, LogOut, Home, Building2, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b-4 border-blue-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/WhatsApp Image 2025-06-30 at 12.26.36.jpeg" 
              alt="HuruSpaces Logo" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold text-blue-600">HuruSpaces</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link to="/places" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
              <Building2 size={20} />
              <span>Places</span>
            </Link>
          </div>

          {/* Desktop Auth Links */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.name}</span>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User size={20} />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu (right side) */}
          <div className="md:hidden flex items-center">
            {!user && (
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 transition-colors mr-4"
              >
                Login
              </Link>
            )}
            <button
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              onClick={toggleMobileMenu}
            >
              <Home size={20} className="mr-2" />
              Home
            </Link>
            <Link
              to="/places"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              onClick={toggleMobileMenu}
            >
              <Building2 size={20} className="mr-2" />
              Places
            </Link>

            {user ? (
              <>
                <div className="px-3 py-2 text-gray-700">
                  Welcome, {user.name}
                </div>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={toggleMobileMenu}
                  >
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                      Admin Panel
                    </span>
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={toggleMobileMenu}
                >
                  <User size={20} className="mr-2" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  className="w-full flex items-center px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md"
                >
                  <LogOut size={20} className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={toggleMobileMenu}
                >
                  <span>Login</span>
                </Link>
                <div className="pt-2 pb-2">
                  <Link
                    to="/register"
                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition-colors"
                    onClick={toggleMobileMenu}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;