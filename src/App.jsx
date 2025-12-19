import React, { Suspense } from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import routesConfig from './routes.jsx';
import './App.css';
import { selectIsAuthenticated, selectIsAdmin } from './redux/auth/authSlice.js';
import { Toaster } from 'react-hot-toast';

const Loader = () => (
  <div className='flex justify-center items-center h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-900'></div>
  </div>
);

const AppRoutes = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  const element = useRoutes(routesConfig);
  return element;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Toaster position="top-right" reverseOrder={false} />
        <AppRoutes />
      </Suspense>
    </Router>
  );
}

export default App;