import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (
      form.password.length < 8 ||
      new TextEncoder().encode(form.password).length > 72
    ) {
      setError(
        "Password must have at least 8 characters and at most 72 bytes"
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });

      saveSession(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Cannot register. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>Create patient account</h1>
      <p>Register to book and manage appointments.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          maxLength={254}
          required
        />

        <label htmlFor="register-phone">Phone number</label>
        <input
          id="register-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          autoComplete="tel"
          pattern="[+]?[0-9]{9,15}"
          title="Enter 9 to 15 digits, optionally starting with +"
          placeholder="0771234567"
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="register-confirm">
          Confirm password
        </label>
        <input
          id="register-confirm"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}