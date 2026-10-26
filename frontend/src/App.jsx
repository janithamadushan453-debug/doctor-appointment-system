import {
  Link,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import AdminDoctors from "./pages/AdminDoctors";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import AdminRoute from "./components/AdminRoute";
import RescheduleAppointment from "./pages/RescheduleAppointment";
import AdminAppointments from "./pages/AdminAppointments";
import Profile from "./pages/Profile";
import DoctorDetails from "./pages/DoctorDetails";

export default function App() {
const { token, user, logout } = useAuth();
  return (
    <>
      <header className="navbar">
        <Link className="brand" to="/">
          Doctor Appointment
        </Link>

<nav aria-label="Main navigation">
  <Link to="/doctors">Doctors</Link>

  {token ? (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/profile">My profile</Link>
      <Link to="/my-appointments">
        My appointments
      </Link>

      {user?.role === "admin" && (
  <>
    <Link to="/admin/doctors">
      Manage doctors
    </Link>

    <Link to="/admin/appointments">
      Manage appointments
    </Link>
  </>
)}

      <button onClick={logout}>Log out</button>
    </>
  ) : (
    <>
      <Link to="/login">Log in</Link>
      <Link to="/register">Register</Link>
    </>
  )}
</nav>
      </header>

      <main className="container">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={token ? "/dashboard" : "/login"}
                replace
              />
            }
          />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/doctors" element={<Doctors />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

<Route
  path="/admin/doctors"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <AdminDoctors />
      </AdminRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/doctors/:id/book"
  element={
    <ProtectedRoute>
      <BookAppointment />
    </ProtectedRoute>
  }
/>

<Route
  path="/my-appointments"
  element={
    <ProtectedRoute>
      <MyAppointments />
    </ProtectedRoute>
  }
/>

<Route
  path="/appointments/:id/reschedule"
  element={
    <ProtectedRoute>
      <RescheduleAppointment />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/appointments"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <AdminAppointments />
      </AdminRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

<Route
  path="/doctors/:id"
  element={<DoctorDetails />}
/>
        </Routes>
      </main>
    </>
  );
}