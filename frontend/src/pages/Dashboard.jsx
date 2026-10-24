import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, token } = useAuth();
  const isAdmin = user.role === "admin";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadAppointments() {
      setLoading(true);
      setError("");

      try {
        const endpoint = isAdmin
          ? "/appointments/admin/all"
          : "/appointments/my";

        const { data } = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!ignore) {
          setAppointments(data.appointments);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
            "Cannot load dashboard information"
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAppointments();

    return () => {
      ignore = true;
    };
  }, [token, isAdmin, version]);

  const booked = appointments.filter(
    (item) => item.status === "booked"
  ).length;

  const completed = appointments.filter(
    (item) => item.status === "completed"
  ).length;

  const cancelled = appointments.filter(
    (item) => item.status === "cancelled"
  ).length;

  const upcoming = appointments
    .filter(
      (item) =>
        item.status === "booked" &&
        new Date(item.startAt) > new Date()
    )
    .sort(
      (a, b) => new Date(a.startAt) - new Date(b.startAt)
    )
    .slice(0, 5);

  return (
    <section>
      <div className="dashboard-heading">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p>
            {isAdmin
              ? "Manage doctors and monitor appointments."
              : "Find a doctor and manage your appointments."}
          </p>
        </div>

        <button
          disabled={loading}
          onClick={() => setVersion((value) => value + 1)}
        >
          Refresh dashboard
        </button>
      </div>

      <div className="dashboard-links">
        <Link className="button-link" to="/doctors">
          Find a doctor
        </Link>

        <Link className="button-link" to="/my-appointments">
          My appointments
        </Link>

        {isAdmin && (
          <>
            <Link
              className="button-link"
              to="/admin/doctors"
            >
              Manage doctors
            </Link>

            <Link
              className="button-link"
              to="/admin/appointments"
            >
              Manage appointments
            </Link>
          </>
        )}
      </div>

      {loading ? (
        <p role="status">Loading dashboard...</p>
      ) : error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : (
        <>
          <h2>
            {isAdmin ? "All appointment records" : "My appointment records"}
          </h2>

          <div className="stats-grid">
            <article className="stat-card">
              <h3>Total</h3>
              <p>{appointments.length}</p>
            </article>

            <article className="stat-card">
              <h3>Booked</h3>
              <p>{booked}</p>
            </article>

            <article className="stat-card">
              <h3>Completed</h3>
              <p>{completed}</p>
            </article>

            <article className="stat-card">
              <h3>Cancelled</h3>
              <p>{cancelled}</p>
            </article>
          </div>

          <h2>Next appointments</h2>

          {upcoming.length === 0 ? (
            <p>No upcoming appointments.</p>
          ) : (
            <div className="doctor-grid">
              {upcoming.map((appointment) => (
                <article
                  className="doctor-card"
                  key={appointment._id}
                >
                  <h3>
                    {appointment.doctorId?.name ||
                      "Doctor unavailable"}
                  </h3>

                  {isAdmin && (
                    <p>
                      Patient:{" "}
                      {appointment.patientId?.name ||
                        "Patient unavailable"}
                    </p>
                  )}

                  <p>
                    {new Date(
                      appointment.startAt
                    ).toLocaleString("en-GB", {
                      timeZone: "Asia/Colombo"
                    })}
                  </p>

                  <p>Sri Lanka time</p>

                  <Link
                    to={
                      isAdmin
                        ? "/admin/appointments"
                        : "/my-appointments"
                    }
                  >
                    View appointments
                  </Link>
                </article>
              ))}
            </div>
          )}

          <p className="dashboard-note">
            Counts reflect the records currently stored.
            Permanently deleted appointments are not included.
          </p>
        </>
      )}
    </section>
  );
}