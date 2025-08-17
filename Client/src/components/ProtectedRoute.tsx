import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

type ProtectedRouteProps = {
  redirectPath?: string;
};

const ProtectedRoute = ({ redirectPath = "/login" }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useUser();

  // 🔹 wait until Firebase finishes checking user
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Loading...
      </div>
    );
  }

  // 🔹 allow access if user is authenticated OR anonymous
  if (user && (isAuthenticated || user.isAnonymous)) {
    return <Outlet />;
  }

  // 🔹 otherwise redirect
  return <Navigate to={redirectPath} replace />;
};

export default ProtectedRoute;
