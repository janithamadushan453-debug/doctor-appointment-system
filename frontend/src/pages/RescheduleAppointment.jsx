import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function displayTime(value) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Colombo"
  });
}

export default function RescheduleAppointment() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [slots, setSlots] = useState([]);
  const [startAt, setStartAt] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setAppointment(null);
      setSlots([]);
      setStartAt("");

      try {
        const { data } = await api.get("/appointments/my", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const booking = data.appointments.find(
          (item) => item._id === id
        );

        if (
          !booking ||
          booking.status !== "booked" ||
          new Date(booking.startAt) <= new Date() ||
          !booking.doctorId
        ) {
          throw new Error(
            "This appointment cannot be rescheduled"
          );
        }

        const response = await api.get(
          `/doctors/${booking.doctorId._id}/slots`
        );

        if (!ignore) {
          setAppointment(booking);
          setSlots(response.data.slots);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Cannot load available slots"
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
  }, [id, token, version]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.patch(
        `/appointments/${id}/reschedule`,
        { startAt },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate("/my-appointments", {
        replace: true,
        state: {
          message: "Appointment rescheduled successfully"
        }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to reschedule. Please try again."
      );

      if (err.response?.status === 409) {
        setLoading(true);
        setVersion((value) => value + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h1>Reschedule appointment</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status">Loading available slots...</p>
      ) : appointment ? (
        <>
          <h2>{appointment.doctorId.name}</h2>

          <p>
            Current appointment:
            {" "}
            <strong>
              {displayTime(appointment.startAt)}
            </strong>
          </p>

          <p>All times are shown in Sri Lanka time.</p>

          {slots.length === 0 ? (
            <p>
              No alternative slots are available.
              Your current appointment remains booked.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="new-slot">
                Choose a new appointment time
              </label>

              <select
                id="new-slot"
                value={startAt}
                onChange={(event) =>
                  setStartAt(event.target.value)
                }
                disabled={saving}
                required
              >
                <option value="">Select a new slot</option>

                {slots.map((slot) => (
                  <option
                    key={slot._id}
                    value={slot.startAt}
                  >
                    {displayTime(slot.startAt)}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={saving || !startAt}
              >
                {saving ? "Saving..." : "Confirm new time"}
              </button>
            </form>
          )}
        </>
      ) : null}

      {!loading && (
        <button
          className="secondary"
          type="button"
          disabled={saving}
          onClick={() => {
            setError("");
            setLoading(true);
            setVersion((value) => value + 1);
          }}
        >
          Refresh slots
        </button>
      )}

      <p>
        <Link to="/my-appointments">
          Back to my appointments
        </Link>
      </p>
    </section>
  );
}