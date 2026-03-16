import { Navigate, Outlet } from "react-router-dom";
import { api } from "@/lib/api";

/**
 * ProtectedRoute component that checks authentication before rendering child routes.
 * If user is not authenticated, redirects to /login page.
 * If authenticated, renders the child routes using Outlet.
 */
export const ProtectedRoute = () => {
  const isAuthenticated = api.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};
