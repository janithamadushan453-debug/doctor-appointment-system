import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/useAuth";

export default function Profile() {
  const {
    user,
    token,
    updateUser,
    logout
  } = useAuth();

  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [busy, setBusy] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  function handleUnauthorized(error) {
    if (error.response?.status === 401) {
      logout();
      navigate("/login", { replace: true });
      return true;
    }

    return false;
  }

  async function saveProfile(event) {
    event.preventDefault();

    setProfileError("");
    setProfileMessage("");
    setBusy(true);

    try {
      const { data } = await api.patch(
        "/auth/profile",
        {
          name: profile.name.trim(),
          phone: profile.phone.trim()
        },
        config
      );

      updateUser(data.user);

      setProfile({
        name: data.user.name,
        phone: data.user.phone
      });

      setProfileMessage(data.message);
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setProfileError(
          error.response?.data?.message ||
          "Unable to update your profile"
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (
      passwords.newPassword.length < 8 ||
      new TextEncoder().encode(
        passwords.newPassword
      ).length > 72
    ) {
      setPasswordError(
        "New password must have at least 8 characters and at most 72 bytes"
      );
      return;
    }

    setBusy(true);

    try {
      await api.patch(
        "/auth/password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        },
        config
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      logout();

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Password changed successfully. Log in with your new password."
        }
      });
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setPasswordError(
          error.response?.data?.message ||
          "Unable to change your password"
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>My profile</h1>

      <div className="profile-grid">
        <section className="profile-panel">
          <h2>Personal details</h2>

          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>

          <form onSubmit={saveProfile}>
            <label htmlFor="profile-name">Full name</label>

            <input
              id="profile-name"
              value={profile.name}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  name: event.target.value
                })
              }
              autoComplete="name"
              minLength={2}
              maxLength={100}
              disabled={busy}
              required
            />

            <label htmlFor="profile-phone">
              Phone number
            </label>

            <input
              id="profile-phone"
              type="tel"
              value={profile.phone}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  phone: event.target.value
                })
              }
              autoComplete="tel"
              pattern="[+]?[0-9]{9,15}"
              title="Enter 9 to 15 digits, optionally starting with +"
              disabled={busy}
              required
            />

            {profileError && (
              <p className="error" role="alert">
                {profileError}
              </p>
            )}

            {profileMessage && (
              <p className="success-message" role="status">
                {profileMessage}
              </p>
            )}

            <button disabled={busy}>
              Save profile
            </button>
          </form>
        </section>

        <section className="profile-panel">
          <h2>Change password</h2>
          <p>
            After changing your password, you will need
            to log in again on all devices.
          </p>

          <form onSubmit={savePassword}>
            <label htmlFor="current-password">
              Current password
            </label>

            <input
              id="current-password"
              type="password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords({
                  ...passwords,
                  currentPassword: event.target.value
                })
              }
              autoComplete="current-password"
              disabled={busy}
              required
            />

            <label htmlFor="new-password">
              New password
            </label>

            <input
              id="new-password"
              type="password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords({
                  ...passwords,
                  newPassword: event.target.value
                })
              }
              autoComplete="new-password"
              minLength={8}
              disabled={busy}
              required
            />

            <label htmlFor="confirm-new-password">
              Confirm new password
            </label>

            <input
              id="confirm-new-password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords({
                  ...passwords,
                  confirmPassword: event.target.value
                })
              }
              autoComplete="new-password"
              minLength={8}
              disabled={busy}
              required
            />

            {passwordError && (
              <p className="error" role="alert">
                {passwordError}
              </p>
            )}

            <button disabled={busy}>
              Change password
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}