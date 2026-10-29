# Doctor Appointment Booking System

A full-stack web application that helps patients find doctors and manage appointments. Administrators manage doctor profiles, publish available appointment slots, and monitor bookings.

## Technologies

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JSON Web Tokens and bcrypt
- Styling: CSS

## Features

### Patients
- Register, log in, and log out.
- Update their name and phone number.
- Change their password.
- Search doctors by name and filter by specialization.
- Sort doctors by consultation fee.
- View doctor photos and detailed profiles.
- Book available 30-minute appointment slots.
- View, reschedule, and cancel their appointments.
- View appointment counts and upcoming visits.

### Administrators
- Add and edit doctor profiles.
- Activate or deactivate doctors.
- Delete doctors without appointment records.
- Publish non-overlapping appointment slots.
- View all appointments.
- Search appointments and filter by status.
- Mark appointments completed after their end time.
- Permanently delete cancelled appointments.


## Requirements

- A Node.js version compatible with the project's Vite version
- npm
- MongoDB Community Server running locally
- Git
- MongoDB Compass (optional)

MongoDB Compass is a database viewer. MongoDB Server must also be installed and running.

## Local Setup

The following commands use Windows PowerShell.

### 1. Clone the repository

```powershell
git clone https://github.com/janithamadushan453-debug/doctor-appointment-system.git
cd doctor-appointment-system
```

### 2. Configure the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/doctor_appointment_db
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
```

Generate a secret using:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `JWT_SECRET`.

Start the backend:

```powershell
npm run dev
```

Expected output:

```text
MongoDB connected
Server running on port 5000
```

Check the API:

```text
http://localhost:5000/api/health
```

### 3. Configure the frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

The frontend environment file should contain:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```powershell
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

If Vite uses another port, update `CLIENT_ORIGIN` in the backend environment file and restart the backend.

### 4. Create an administrator

1. Register an account using the application.
2. Open another terminal inside `backend`.
3. Run the following command with the registered email:

```powershell
node scripts/makeAdmin.js your-email@example.com
```

4. Log out and log in again.
5. Open **Manage doctors** to add doctors and publish future slots.

There are no default account credentials. Public registration creates patient accounts.


