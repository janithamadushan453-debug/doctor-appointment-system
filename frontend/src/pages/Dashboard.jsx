import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

function CalendarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M4 11h16" />
      <path d="M8 15h2M14 15h2" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <div className="pd-illustration" aria-hidden="true">
      <div className="pd-calendar">
        <div className="pd-calendar-top">
          <span />
          <span />
        </div>

        <div className="pd-calendar-grid">
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              className={index === 6 ? "selected" : ""}
            />
          ))}
        </div>
      </div>

      <div className="pd-medical-cross">+</div>
    </div>
  );
}

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
              "Cannot load dashboard information. Please try again."
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

  const stats = [
    {
      label: "Total appointments",
      value: appointments.length,
      color: "blue"
    },
    {
      label: "Booked",
      value: appointments.filter(
        (item) => item.status === "booked"
      ).length,
      color: "green"
    },
    {
      label: "Completed",
      value: appointments.filter(
        (item) => item.status === "completed"
      ).length,
      color: "purple"
    },
    {
      label: "Cancelled",
      value: appointments.filter(
        (item) => item.status === "cancelled"
      ).length,
      color: "red"
    }
  ];

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

  const appointmentsPath = isAdmin
    ? "/admin/appointments"
    : "/my-appointments";

  const actions = [
    {
      title: "Find a doctor",
      description: "Search by name or specialization",
      to: "/doctors",
      icon: "⌕"
    },
    {
      title: isAdmin ? "Manage appointments" : "My appointments",
      description: isAdmin
        ? "Review and manage patient bookings"
        : "View and manage your appointments",
      to: appointmentsPath,
      icon: "▦"
    },
    {
      title: "Edit profile",
      description: "Update your personal information",
      to: "/profile",
      icon: "○"
    }
  ];

  if (isAdmin) {
    actions.push({
      title: "Manage doctors",
      description: "Edit profiles and publish available slots",
      to: "/admin/doctors",
      icon: "+"
    });
  }

  return (
    <section className="patient-dashboard">
      <div className="pd-heading">
        <div>
          <h1>Welcome back, {user.name}</h1>

          <p>
            {isAdmin
              ? "Manage doctors and monitor patient appointments."
              : "Manage your appointments and plan your next visit."}
          </p>
        </div>

        <button
          className="pd-outline-button"
          disabled={loading}
          onClick={() => setVersion((value) => value + 1)}
        >
          {loading ? "Refreshing..." : "↻ Refresh dashboard"}
        </button>
      </div>

      <section className="pd-welcome">
        <div className="pd-welcome-copy">
          <h2>
            {isAdmin
              ? "Your appointment management hub."
              : "Your next visit, made simple."}
          </h2>

          <p>
            {isAdmin
              ? "Keep doctor profiles, availability and booking records organized."
              : "Find a doctor, choose an available time and manage your bookings in one place."}
          </p>

          <div className="pd-banner-actions">
            <Link
              className="pd-primary-link"
              to={isAdmin ? "/admin/doctors" : "/doctors"}
            >
              {isAdmin ? "Manage doctors" : "Find a doctor"}
              <span aria-hidden="true"> →</span>
            </Link>

            <Link
              className="pd-outline-link"
              to={appointmentsPath}
            >
              {isAdmin ? "Manage appointments" : "My appointments"}
            </Link>
          </div>
        </div>

        <CalendarIllustration />
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="pd-loading" role="status">
          Loading your dashboard...
        </p>
      ) : error ? (
        <p>Use Refresh dashboard to try again.</p>
      ) : (
        <>
          <div
            className="pd-stats"
            aria-label={
              isAdmin
                ? "All appointment counts"
                : "Your appointment counts"
            }
          >
            {stats.map((stat) => (
              <article className="pd-stat" key={stat.label}>
                <span className={`pd-stat-icon ${stat.color}`}>
                  <CalendarIcon />
                </span>

                <div>
                  <h2>{stat.label}</h2>
                  <strong>{stat.value}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="pd-main-grid">
            <section className="pd-panel">
              <div className="pd-panel-heading">
                <div>
                  <h2>Upcoming appointments</h2>
                  <p>All times are shown in Sri Lanka time.</p>
                </div>

                <Link to={appointmentsPath}>
                  View all →
                </Link>
              </div>

              {upcoming.length === 0 ? (
                <div className="pd-empty">
                  <CalendarIcon />
                  <h3>No upcoming appointments</h3>
                  <p>
                    {isAdmin
                      ? "Upcoming patient bookings will appear here."
                      : "Choose a doctor and book your next visit."}
                  </p>

                  {!isAdmin && (
                    <Link className="pd-primary-link" to="/doctors">
                      Find a doctor
                    </Link>
                  )}
                </div>
              ) : (
                <div className="pd-appointment-list">
                  {upcoming.map((appointment) => {
                    const doctor = appointment.doctorId;
                    const date = new Date(appointment.startAt);

                    const initials = (doctor?.name || "Doctor")
                      .replace(/^Dr\.?\s*/i, "")
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <article
                        className="pd-appointment"
                        key={appointment._id}
                      >
                        <div
                          className="pd-doctor-avatar"
                          aria-hidden="true"
                        >
                          {initials}
                        </div>

                        <div className="pd-doctor-info">
                          <h3>
                            {doctor?.name || "Doctor unavailable"}
                          </h3>

                          <p>{doctor?.specialization}</p>

                          {isAdmin && (
                            <p>
                              Patient:{" "}
                              {appointment.patientId?.name ||
                                "Patient unavailable"}
                            </p>
                          )}
                        </div>

                        <div className="pd-appointment-time">
                          <strong>
                            {date.toLocaleDateString("en-GB", {
                              timeZone: "Asia/Colombo",
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </strong>

                          <span>
                            {date.toLocaleTimeString("en-GB", {
                              timeZone: "Asia/Colombo",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true
                            })}
                          </span>
                        </div>

                        <span className="pd-booked-badge">
                          <span aria-hidden="true">●</span> Booked
                        </span>

                        <Link
                          className="pd-manage-link"
                          to={appointmentsPath}
                          aria-label={`Manage appointments for ${
                            doctor?.name || "this doctor"
                          }`}
                        >
                          Manage
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="pd-sidebar">
              <section className="pd-panel">
                <h2>Quick actions</h2>

                <div className="pd-quick-actions">
                  {actions.map((action) => (
                    <Link
                      className="pd-action"
                      to={action.to}
                      key={action.title}
                    >
                      <span
                        className="pd-action-icon"
                        aria-hidden="true"
                      >
                        {action.icon}
                      </span>

                      <span>
                        <strong>{action.title}</strong>
                        <small>{action.description}</small>
                      </span>

                      <span aria-hidden="true">›</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="pd-panel pd-profile-note">
                <span className="pd-note-icon">
                  <CalendarIcon />
                </span>

                <div>
                  <h3>Keep your details up to date</h3>
                  <p>
                    Update your phone number before your next visit.
                  </p>

                  <Link to="/profile">Edit profile →</Link>
                </div>
              </section>
            </aside>
          </div>

          <p className="pd-count-note">
            {isAdmin
              ? "Counts include all appointment records currently stored."
              : "Counts include your appointment records currently stored."}
            {" "}Permanently deleted records are excluded.
          </p>
        </>
      )}
    </section>
  );
}