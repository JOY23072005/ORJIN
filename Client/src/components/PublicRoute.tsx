import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

type PublicRouteProps = {
  redirectPath?: string;
};

const PublicRoute = ({ redirectPath = "/" }: PublicRouteProps) => {
  const { user, isAuthenticated, loading } = useUser();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If already logged in (or anonymous), send them away
  if (user && (isAuthenticated || user.isAnonymous)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
