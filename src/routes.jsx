import React from "react";
import { Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import UserOnboardPage from "./pages/auth/UserOnboardPage";
import DashBoardLayout from "./pages/dashboard/DashBoardLayout";
import AuthLayout from "./routes/AuthLayout";

const routes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/onboard",
    element: <UserOnboardPage />,
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
