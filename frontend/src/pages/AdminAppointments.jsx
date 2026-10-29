import { useEffect, useState } from "react";

import api from "../services/api";
import { useAuth } from "../context/useAuth";
function displayTime(value) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Colombo"
  });
}

export default function AdminAppointments() {
  const { token } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadAppointments() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(
          "/appointments/admin/all",
          {
            params: { status },
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!ignore) {
          setAppointments(data.appointments);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
            "Unable to load appointments"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      ignore = true;
    };
  }, [token, status, version]);

  async function updateAppointment(appointment, action) {
    const isDelete = action === "delete";

    const confirmation = isDelete
      ? "Permanently delete this cancelled appointment? This cannot be undone."
      : "Mark this appointment as completed?";

    if (!window.confirm(confirmation)) return;

    setBusy(true);
    setError("");
    setMessage("");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    try {
      let response;

      if (isDelete) {
        response = await api.delete(
          `/appointments/${appointment._id}`,
          config
        );
      } else {
        response = await api.patch(
          `/appointments/${appointment._id}/complete`,
          {},
          config
        );
      }

      setMessage(response.data.message);

      if (isDelete) {
        setAppointments((previous) =>
          previous.filter(
            (item) => item._id !== appointment._id
          )
        );
      } else {
        setAppointments((previous) =>
          previous
            .map((item) =>
              item._id === appointment._id
                ? { ...item, status: "completed" }
                : item
            )
            .filter(
              (item) => !status || item.status === status
            )
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update the appointment"
      );
    } finally {
      setBusy(false);
    }
  }

  const query = search.trim().toLowerCase();

  const filteredAppointments = appointments.filter(
    (appointment) => {
      const searchableText = [
        appointment.patientId?.name,
        appointment.patientId?.email,
        appointment.doctorId?.name,
        appointment.doctorId?.specialization
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    }
  );

  return (
    <section>
      <h1>Manage appointments</h1>
      <p>All appointment times are shown in Sri Lanka time.</p>

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="doctor-filters">
        <div>
          <label htmlFor="appointment-search">
            Search patient or doctor
          </label>

          <input
            id="appointment-search"
            type="search"
            placeholder="Name, email, or specialization"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="appointment-status">
            Appointment status
          </label>

          <select
            id="appointment-status"
            value={status}
            disabled={busy}
            onChange={(event) => {
              setStatus(event.target.value);
              setLoading(true);
              setMessage("");
            }}
          >
            <option value="">All statuses</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          type="button"
          disabled={busy || loading}
          onClick={() => {
            setLoading(true);
            setVersion((value) => value + 1);
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p role="status">Loading appointments...</p>
      ) : error && appointments.length === 0 ? (
        <p>Use Refresh to try loading the records again.</p>
      ) : (
        <>
          <p>
            Showing {filteredAppointments.length} appointment(s)
          </p>

          {filteredAppointments.length === 0 ? (
            <p>No appointments match your filters.</p>
          ) : (
            <div className="table-scroll">
              <table className="appointment-table">
                <caption>
                  Appointment records
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Doctor</th>
                    <th scope="col">Date and time</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map((appointment) => {
                    const canComplete =
                      appointment.status === "booked" &&
                      new Date(appointment.endAt) <= new Date();

                    const canDelete =
                      appointment.status === "cancelled";

                    return (
                      <tr key={appointment._id}>
                        <td>
                          <strong>
                            {appointment.patientId?.name ||
                              "Patient unavailable"}
                          </strong>

                          <div>
                            {appointment.patientId?.email}
                          </div>

                          <div>
                            {appointment.patientId?.phone}
                          </div>
                        </td>

                        <td>
                          {appointment.doctorId?.name ||
                            "Doctor unavailable"}

                          <div>
                            {appointment.doctorId?.specialization}
                          </div>
                        </td>

                        <td>
                          {displayTime(appointment.startAt)}
                        </td>

                        <td>{appointment.reason}</td>

                        <td>
                          <span
                            className={
                              `status-badge status-${appointment.status}`
                            }
                          >
                            {appointment.status}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            {canComplete && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  updateAppointment(
                                    appointment,
                                    "complete"
                                  )
                                }
                              >
                                Mark completed
                              </button>
                            )}

                            {canDelete && (
                              <button
                                className="danger"
                                disabled={busy}
                                onClick={() =>
                                  updateAppointment(
                                    appointment,
                                    "delete"
                                  )
                                }
                              >
                                Delete
                              </button>
                            )}

                            {!canComplete && !canDelete && (
                              <span>No action available</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}