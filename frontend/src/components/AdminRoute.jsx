import { useAuth } from "../context/useAuth";
export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <p role="alert">Admin access required.</p>;
  }

  return children;
}