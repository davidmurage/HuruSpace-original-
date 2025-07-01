import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Accessibility, Heart, Shield } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-green-300">HuruSpaces</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover accessible restaurants and offices designed for people with disabilities. 
              Find spaces that welcome everyone with open arms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/places"
                className="bg-green-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Explore Places
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose HuruSpaces?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to creating an inclusive world where accessibility is not an afterthought, but a priority.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Location</h3>
              <p className="text-gray-600">
                Find accessible places near you with detailed location information and directions.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Accessibility className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibility First</h3>
              <p className="text-gray-600">
                Every listed place is verified for accessibility features and PWD-friendly amenities.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Built by and for the PWD community with real reviews and experiences.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Places</h3>
              <p className="text-gray-600">
                All locations are personally verified to ensure they meet accessibility standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users who have found their perfect accessible spaces through HuruSpaces.
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;