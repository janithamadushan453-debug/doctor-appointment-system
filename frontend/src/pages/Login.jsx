import { useState } from "react";
import { Link,useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password
      });

      saveSession(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Cannot log in. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>Log in</h1>
      {location.state?.message && (
  <p className="success-message" role="status">
    {location.state.message}
  </p>
)}
      <p>Access your appointment account.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p>
        New patient? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}