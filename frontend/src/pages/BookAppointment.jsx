import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function BookAppointment() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [startAt, setStartAt] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setStartAt("");

      try {
        const { data } = await api.get(`/doctors/${id}/slots`);

        if (!ignore) {
          setDoctor(data.doctor);
          setSlots(data.slots);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message || "Cannot load slots"
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
  }, [id, version]);

  async function book(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await api.post(
        "/appointments",
        { doctorId: id, startAt, reason: reason.trim() },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      navigate("/my-appointments", {
        replace: true,
        state: { message: "Appointment booked successfully" }
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Cannot book appointment"
      );

      if (err.response?.status === 409) {
        setVersion((value) => value + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h1>Book an appointment</h1>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p role="status">Loading available slots...</p>
      ) : doctor ? (
        <>
          <h2>{doctor.name}</h2>
          <p>{doctor.specialization}</p>
          <p>Consultation fee: LKR {doctor.consultationFee}</p>

          {slots.length === 0 ? (
            <p>No available slots. Please check again later.</p>
          ) : (
            <form onSubmit={book}>
              <label htmlFor="booking-slot">
                Available time — Sri Lanka time
              </label>

              <select
                id="booking-slot"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={busy}
                required
              >
                <option value="">Select a slot</option>

                {slots.map((slot) => (
                  <option key={slot._id} value={slot.startAt}>
                    {new Date(slot.startAt).toLocaleString(
                      "en-GB",
                      { timeZone: "Asia/Colombo" }
                    )}
                  </option>
                ))}
              </select>

              <label htmlFor="booking-reason">Reason for visit</label>

              <textarea
                id="booking-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={busy}
                required
              />

              <button
                disabled={busy || !startAt || !reason.trim()}
              >
                {busy ? "Booking..." : "Confirm appointment"}
              </button>
            </form>
          )}
        </>
      ) : null}

      <p><Link to="/doctors">Back to doctors</Link></p>
    </section>
  );
}