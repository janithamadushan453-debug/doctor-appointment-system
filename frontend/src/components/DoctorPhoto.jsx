import { useState } from "react";

export default function DoctorPhoto({ src, name }) {
  const [failedSrc, setFailedSrc] = useState(null);

  const initials = name
    .replace(/^Dr\.?\s*/i, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (!src || failedSrc === src) {
    return (
      <div
        className="doctor-photo photo-placeholder"
        role="img"
        aria-label={`Photo unavailable for ${name}`}
      >
        {initials || "DR"}
      </div>
    );
  }

  return (
    <img
      className="doctor-photo"
      src={src}
      alt={`Portrait of ${name}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}