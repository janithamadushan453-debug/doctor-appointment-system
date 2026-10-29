import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
const emptyForm = {
  name: "",
  specialization: "",
  qualifications: "",
  consultationFee: "",
  isActive: true,
  photoUrl: "",
  experienceYears: "0",
  languages: "",
  clinicLocation: "",
  bio: ""
};

export default function AdminDoctors() {
  const { token } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [slotTimes, setSlotTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      try {
        const { data } = await api.get("/doctors/admin/all", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!ignore) setDoctors(data.doctors);
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message || "Cannot load doctors"
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

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function editDoctor(doctor) {
    setEditingId(doctor._id);
    setForm({
  name: doctor.name,
  specialization: doctor.specialization,
  qualifications: doctor.qualifications || "",
  consultationFee: String(doctor.consultationFee),
  isActive: doctor.isActive,
  photoUrl: doctor.photoUrl || "",
  experienceYears: String(doctor.experienceYears ?? 0),
  languages: doctor.languages || "",
  clinicLocation: doctor.clinicLocation || "",
  bio: doctor.bio || ""
});

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function perform(action) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await action();

      setMessage(response.data.message);
      setVersion((value) => value + 1);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message || "Request failed"
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveDoctor(event) {
    event.preventDefault();

    const body = {
  ...form,
  consultationFee: Number(form.consultationFee),
  experienceYears: Number(form.experienceYears)
};

    const saved = await perform(() =>
      editingId
        ? api.patch(`/doctors/${editingId}`, body, config)
        : api.post("/doctors", body, config)
    );

    if (saved) resetForm();
  }

  async function deleteDoctor(doctor) {
  const confirmed = window.confirm(
    `Deactivate ${doctor.name}? Existing appointments will be preserved.`
  );

  if (!confirmed) return;

  const deactivated = await perform(() =>
    api.delete(`/doctors/${doctor._id}`, config)
  );

  if (deactivated && editingId === doctor._id) {
    resetForm();
  }
}

  async function addSlot(event, doctorId) {
    event.preventDefault();

    const localValue = slotTimes[doctorId];

    if (!localValue) return;

    // Explicitly interpret the entered time as Sri Lanka time.
    const startAt = new Date(
      `${localValue}:00+05:30`
    ).toISOString();

    const saved = await perform(() =>
      api.post(
        `/doctors/${doctorId}/slots`,
        { startAt },
        config
      )
    );

    if (saved) {
      setSlotTimes((previous) => ({
        ...previous,
        [doctorId]: ""
      }));
    }
  }

  return (
    <section>
      <h1>Manage doctors</h1>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <form className="card" onSubmit={saveDoctor}>
        <h2>{editingId ? "Edit doctor" : "Add doctor"}</h2>

        <fieldset disabled={busy} className="form-fields">
          <label htmlFor="admin-name">Doctor name</label>
          <input
            id="admin-name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            minLength={2}
            maxLength={100}
            required
          />

          <label htmlFor="admin-specialization">Specialization</label>
          <input
            id="admin-specialization"
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
            minLength={2}
            maxLength={100}
            required
          />

          <label htmlFor="admin-qualifications">Qualifications</label>
          <input
            id="admin-qualifications"
            value={form.qualifications}
            onChange={(e) =>
              setForm({ ...form, qualifications: e.target.value })
            }
            maxLength={500}
          />

          <label htmlFor="admin-fee">Consultation fee (LKR)</label>
          <input
            id="admin-fee"
            type="number"
            min="0"
            step="0.01"
            value={form.consultationFee}
            onChange={(e) =>
              setForm({ ...form, consultationFee: e.target.value })
            }
            required
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active doctor
          </label>

          <label htmlFor="admin-photo">Photo URL</label>
<input
  id="admin-photo"
  type="url"
  value={form.photoUrl}
  onChange={(e) =>
    setForm({ ...form, photoUrl: e.target.value })
  }
  placeholder="https://example.com/doctor-photo.jpg"
  maxLength={2000}
/>

<label htmlFor="admin-experience">
  Years of experience
</label>
<input
  id="admin-experience"
  type="number"
  min="0"
  max="80"
  step="1"
  value={form.experienceYears}
  onChange={(e) =>
    setForm({ ...form, experienceYears: e.target.value })
  }
  required
/>

<label htmlFor="admin-languages">Languages spoken</label>
<input
  id="admin-languages"
  value={form.languages}
  onChange={(e) =>
    setForm({ ...form, languages: e.target.value })
  }
  placeholder="Sinhala, Tamil, English"
  maxLength={200}
/>

<label htmlFor="admin-clinic">Clinic location</label>
<input
  id="admin-clinic"
  value={form.clinicLocation}
  onChange={(e) =>
    setForm({ ...form, clinicLocation: e.target.value })
  }
  placeholder="Clinic name and address"
  maxLength={300}
/>

<label htmlFor="admin-bio">About the doctor</label>
<textarea
  id="admin-bio"
  value={form.bio}
  onChange={(e) =>
    setForm({ ...form, bio: e.target.value })
  }
  rows={5}
  maxLength={2000}
/>

          <div className="actions">
            <button type="submit">
              {busy ? "Saving..." : "Save doctor"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel editing
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {loading ? (
        <p role="status">Loading doctors...</p>
      ) : (
        <div className="doctor-grid admin-grid">
          {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor._id}>
              <h2>{doctor.name}</h2>
              <p>{doctor.specialization}</p>
              <p>LKR {doctor.consultationFee}</p>
              <p>{doctor.isActive ? "Active" : "Inactive"}</p>

              <div className="actions">
                <button
                  disabled={busy}
                  onClick={() => editDoctor(doctor)}
                >
                  Edit
                </button>

                <button
  className="danger"
  disabled={busy || !doctor.isActive}
  onClick={() => deleteDoctor(doctor)}
>
  {doctor.isActive ? "Deactivate" : "Inactive"}
</button>
              </div>

              {doctor.isActive && (
                <form onSubmit={(e) => addSlot(e, doctor._id)}>
                  <label htmlFor={`slot-${doctor._id}`}>
                    Add slot — Sri Lanka time
                  </label>

                  <input
                    id={`slot-${doctor._id}`}
                    type="datetime-local"
                    value={slotTimes[doctor._id] || ""}
                    onChange={(e) =>
                      setSlotTimes({
                        ...slotTimes,
                        [doctor._id]: e.target.value
                      })
                    }
                    required
                  />

                  <button disabled={busy}>
                    Add 30-minute slot
                  </button>
                </form>
              )}

              <details>
                <summary>
                  Published slots ({doctor.availability.length})
                </summary>

                <ul>
                  {doctor.availability.map((slot) => (
                    <li key={slot._id}>
                      {new Date(slot.startAt).toLocaleString(
                        "en-GB",
                        { timeZone: "Asia/Colombo" }
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}