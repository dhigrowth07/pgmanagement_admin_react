import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated, selectIsAdmin } from '../redux/auth/authSlice';

const AuthLayout = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isAdmin = useSelector(selectIsAdmin);

    if (isAuthenticated && isAdmin) {
        return <Outlet />;
    }

    return <Navigate to="/login" />;
};

export default AuthLayout;