import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import DoctorPhoto from "../components/DoctorPhoto";

export default function DoctorDetails() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadDoctor() {
      setLoading(true);
      setError("");
      setDoctor(null);

      try {
        const { data } = await api.get(`/doctors/${id}`);

        if (!ignore) {
          setDoctor(data.doctor);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
            "Cannot load the doctor profile"
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDoctor();

    return () => {
      ignore = true;
    };
  }, [id, version]);

  return (
    <section>
      <p><Link to="/doctors">Back to doctors</Link></p>

      {loading ? (
        <p role="status">Loading doctor profile...</p>
      ) : error ? (
        <div>
          <p className="error" role="alert">{error}</p>

          <button
            onClick={() => setVersion((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : doctor ? (
        <article className="doctor-detail">
          <div>
            <DoctorPhoto
              src={doctor.photoUrl}
              name={doctor.name}
            />

            <p className="doctor-fee">
              {new Intl.NumberFormat("en-LK", {
                style: "currency",
                currency: "LKR"
              }).format(doctor.consultationFee)}
            </p>

            <p>Consultation fee</p>

            <Link
              className="button-link"
              to={`/doctors/${doctor._id}/book`}
            >
              Book appointment
            </Link>
          </div>

          <div>
            <span className="specialization">
              {doctor.specialization}
            </span>

            <h1>{doctor.name}</h1>

            <dl className="profile">
              <dt>Qualifications</dt>
              <dd>
                {doctor.qualifications || "Not provided"}
              </dd>

              <dt>Experience</dt>
              <dd>{doctor.experienceYears ?? 0} years</dd>

              <dt>Languages spoken</dt>
              <dd>{doctor.languages || "Not provided"}</dd>

              <dt>Clinic location</dt>
              <dd>
                {doctor.clinicLocation || "Not provided"}
              </dd>
            </dl>

            <h2>About the doctor</h2>
            <p className="doctor-bio">
              {doctor.bio || "No introduction provided yet."}
            </p>
          </div>
        </article>
      ) : null}
    </section>
  );
}