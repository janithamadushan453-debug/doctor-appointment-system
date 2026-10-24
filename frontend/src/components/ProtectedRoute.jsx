import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const {
    token,
    user,
    loading,
    error,
    retry,
    logout
  } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <p role="status">Loading your profile...</p>;
  }

  if (error) {
    return (
      <section className="card">
        <p className="error" role="alert">
          {error}
        </p>

        <button onClick={retry}>Try again</button>

        <button
          className="secondary"
          onClick={logout}
        >
          Log out
        </button>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}