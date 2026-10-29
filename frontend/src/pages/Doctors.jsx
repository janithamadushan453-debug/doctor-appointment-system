import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import DoctorPhoto from "../components/DoctorPhoto";

export default function Doctors() {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [sort, setSort] = useState("name");

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadDoctors() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/doctors", {
          params: {
            search: search.trim(),
            specialization,
            sort
          }
        });

        if (!ignore) {
          setDoctors(data.doctors);
          setSpecializations(data.specializations);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              "Cannot load doctors. Please try again."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    const timer = setTimeout(loadDoctors, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, specialization, sort, retryCount]);

  const currency = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  });

  return (
    <div className="discovery-page">
      <section className="discovery-hero">
        <div className="hero-copy">
          <span className="hero-label">
            YOUR NEXT APPOINTMENT STARTS HERE
          </span>

          <h1>
            Find the right doctor.
            <span>Book with confidence.</span>
          </h1>

          <p>
            Browse specialists and book your next
            appointment in minutes.
          </p>

          <a className="button-link hero-button" href="#specialists">
            Find a doctor <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="hero-visual">
          <img
            src="/images/doctor-hero.jpg"
            alt="Doctor welcoming patients at a clinic"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      </section>

      <section className="discovery-search" aria-label="Find doctors">
        <div className="search-field">
          <label htmlFor="doctor-search">
            Search by doctor name
          </label>

          <input
            id="doctor-search"
            type="search"
            placeholder="e.g. Dr. Nimal Perera"
            value={search}
            maxLength={100}
            onChange={(event) => {
              setSearch(event.target.value);
              setLoading(true);
            }}
          />
        </div>

        <div className="search-field">
          <label htmlFor="doctor-specialization">
            Specialization
          </label>

          <select
            id="doctor-specialization"
            value={specialization}
            onChange={(event) => {
              setSpecialization(event.target.value);
              setLoading(true);
            }}
          >
            <option value="">All specializations</option>

            {specializations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setSpecialization("");
            setSort("name");
          }}
        >
          Reset filters
        </button>
      </section>

      <section id="specialists" className="specialists-section">
        <div className="specialists-heading">
          <div>
            <h2>Find your specialist</h2>
            <p>
              Compare doctor profiles and choose an appointment
              that suits you.
            </p>
          </div>

          <div className="sort-control">
            <label htmlFor="doctor-sort">Sort doctors</label>

            <select
              id="doctor-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setLoading(true);
              }}
            >
              <option value="name">Name: A–Z</option>
              <option value="feeAsc">Lowest fee first</option>
              <option value="feeDesc">Highest fee first</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="discovery-state" role="status">
            Loading doctors...
          </p>
        ) : error ? (
          <div className="discovery-state">
            <p className="error" role="alert">{error}</p>

            <button
              onClick={() => {
                setLoading(true);
                setRetryCount((count) => count + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <p className="discovery-state">
            No doctors match your search. Try another name
            or specialization.
          </p>
        ) : (
          <>
            <p className="results-count">
              {doctors.length} doctor(s) found
            </p>

            <div className="discovery-grid">
              {doctors.map((doctor) => (
                <article
                  className="discovery-card"
                  key={doctor._id}
                >
                  <div className="doctor-card-content">
                    <DoctorPhoto
                      src={doctor.photoUrl}
                      name={doctor.name}
                    />

                    <div className="doctor-card-info">
                      <h3>{doctor.name}</h3>

                      <p className="specialty-text">
                        {doctor.specialization}
                      </p>

                      <p>
                        {doctor.qualifications ||
                          "Qualifications not provided"}
                      </p>

                      <p>
                        {doctor.experienceYears ?? 0} years
                        of experience
                      </p>

                      <p>
                        {doctor.languages ||
                          "Languages not specified"}
                      </p>

                      <div className="consultation-price">
                        <span>Consultation fee</span>
                        <strong>
                          {currency.format(
                            doctor.consultationFee
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="doctor-card-actions">
                    <Link
                      className="profile-link"
                      to={`/doctors/${doctor._id}`}
                    >
                      View profile →
                    </Link>

                    <Link
                      className="button-link"
                      to={`/doctors/${doctor._id}/book`}
                    >
                      Book appointment
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}