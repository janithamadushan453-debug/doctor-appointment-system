import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("authToken")
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setUser(null);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (active) {
          setUser(data.user);
        }
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem("authToken");
          setToken(null);
        } else {
          setError(
            "Cannot load your profile. Check that the backend is running."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [token, retryCount]);

  function saveSession(data) {
    sessionStorage.setItem("authToken", data.token);
    setError("");
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    sessionStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
    setError("");
  }

  function retry() {
    setRetryCount((count) => count + 1);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        saveSession,
        logout,
        retry,
        updateUser: setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}