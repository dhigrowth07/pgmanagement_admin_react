import React from "react";
import { Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
// import UserOnboardPage from "./pages/auth/UserOnboardPage";
import DashBoardLayout from "./pages/dashboard/DashBoardLayout";
import AuthLayout from "./routes/AuthLayout";
import UserOnboardPage2 from './pages/auth/UserOnboardPage2';

const routes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/onboard",
    element: <UserOnboardPage2 />,
  },
  {
    path: "/dashboard",
    element: <AuthLayout />,
    children: [{ path: "", element: <DashBoardLayout /> }],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
];

export default routes;
