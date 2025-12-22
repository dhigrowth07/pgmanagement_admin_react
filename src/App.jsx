import React, { Suspense } from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { useSelector } from "react-redux";
import routesConfig from "./routes.jsx";
import "./App.css";
import { selectIsAuthenticated, selectIsAdmin } from "./redux/auth/authSlice.js";
import { Toaster } from "react-hot-toast";

const Loader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
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
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{
          zIndex: 9999,
          position: "fixed",
          top: "20px",
          right: "20px",
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
            zIndex: 9999,
            minWidth: "300px",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Router>
        <Suspense fallback={<Loader />}>
          <AppRoutes />
        </Suspense>
      </Router>
    </>
  );
}

export default App;
