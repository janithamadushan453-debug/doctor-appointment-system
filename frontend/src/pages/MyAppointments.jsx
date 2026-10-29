import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/useAuth";

export default function MyAppointments() {
  const { token } = useAuth();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    location.state?.message || ""
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      try {
        const { data } = await api.get("/appointments/my", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!ignore) setAppointments(data.appointments);
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
            "Cannot load appointments"
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [token, version]);

  async function cancel(id) {
    if (!window.confirm("Cancel this appointment?")) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { data } = await api.patch(
        `/appointments/${id}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage(data.message);
      setVersion((value) => value + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Cannot cancel appointment"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>My appointments</h1>

      {message && <p role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p role="status">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p>You have no appointments yet.</p>
      ) : (
        <div className="doctor-grid">
          {appointments.map((appointment) => (
            <article
              className="doctor-card"
              key={appointment._id}
            >
              <h2>
                {appointment.doctorId?.name ||
                  "Doctor unavailable"}
              </h2>

              <p>
                {appointment.doctorId?.specialization}
              </p>

              <p>
                {new Date(appointment.startAt).toLocaleString(
                  "en-GB",
                  { timeZone: "Asia/Colombo" }
                )}{" "}
                (Sri Lanka time)
              </p>

              <p>Reason: {appointment.reason}</p>
              <p>Status: <strong>{appointment.status}</strong></p>
{appointment.status === "booked" &&
  new Date(appointment.startAt) > new Date() && (
    <div className="actions">
      <Link
        className="button-link"
        to={`/appointments/${appointment._id}/reschedule`}
      >
        Reschedule
      </Link>

      <button
        className="danger"
        disabled={busy}
        onClick={() => cancel(appointment._id)}
      >
        Cancel appointment
      </button>
    </div>
  )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}