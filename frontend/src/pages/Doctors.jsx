import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

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
            "Cannot load doctors. Check that the backend is running."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    // Wait briefly before searching while the user types.
    const timer = setTimeout(loadDoctors, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, specialization, sort, retryCount]);

  function resetFilters() {
    setSearch("");
    setSpecialization("");
    setSort("name");
  }

  const currency = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR"
  });

  return (
    <section>
      <h1>Find a doctor</h1>
      <p>Search doctors and compare consultation fees.</p>

      <div className="doctor-filters">
        <div>
          <label htmlFor="doctor-search">Doctor name</label>
          <input
            id="doctor-search"
            type="search"
            placeholder="Search by name"
            value={search}
            maxLength={100}
            onChange={(event) => {
              setSearch(event.target.value);
              setLoading(true);
            }}
          />
        </div>

        <div>
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

        <div>
          <label htmlFor="doctor-sort">Sort by</label>
          <select
            id="doctor-sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setLoading(true);
            }}
          >
            <option value="name">Name: A–Z</option>
            <option value="feeAsc">Fee: low to high</option>
            <option value="feeDesc">Fee: high to low</option>
          </select>
        </div>

        <button type="button" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {loading ? (
        <p role="status">Loading doctors...</p>
      ) : error ? (
        <div>
          <p className="error" role="alert">
            {error}
          </p>

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
        <p>No doctors found. Try another search.</p>
      ) : (
        <>
          <p>{doctors.length} doctor(s) found</p>

          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <article className="doctor-card" key={doctor._id}>
                <span className="specialization">
                  {doctor.specialization}
                </span>

                <h2>{doctor.name}</h2>

                <p>
                  {doctor.qualifications ||
                    "Qualifications not provided"}
                </p>

                <p className="doctor-fee">
                  {currency.format(doctor.consultationFee)}
                </p>

                <p>Consultation fee</p>
        <Link
           className="button-link"
           to={`/doctors/${doctor._id}/book`}
        >
           Book appointment
        </Link>
                
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}