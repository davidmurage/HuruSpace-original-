import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Places from './pages/Places';
import PlaceDetails from './pages/PlaceDetails';
import AdminDashboard from './pages/AdminDashboard';
import { store, RootState, AppDispatch } from './store/store';
import { fetchCurrentUser } from './store/slices/authSlice';

const AppShell: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    const html = document.documentElement;
    const interaction = user?.accessibilityProfile.interaction;

    html.classList.toggle('hs-large-text', Boolean(interaction?.largeText));
    html.classList.toggle('hs-high-contrast', Boolean(interaction?.highContrast));
    html.classList.toggle('hs-simplified-ui', Boolean(interaction?.simplifiedUi));
  }, [user]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/places" element={<Places />} />
          <Route path="/places/:id" element={<PlaceDetails />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}

export default App;
