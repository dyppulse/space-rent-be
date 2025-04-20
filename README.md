# 🏗️ Space Rental Platform - Backend

This is the backend codebase for the **Space Rental Platform MVP** focused on **non-sleeping spaces** such as event venues, studios, wedding locations, and conference rooms. The backend handles space listings, user authentication (for space owners), and booking management.

---

## 🚀 MVP Goals

- Connect **space owners** with people looking to rent non-accommodation spaces for short-term use.
- Allow **space owners** to manage their listings.
- Allow **clients** (renters) to browse and book without logging in.

---

## 🧰 Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Backend       | Node.js, Express                   |
| Database      | PostgreSQL (or MongoDB)            |
| Auth          | JWT (Email & Password)             |
| Image Uploads | Cloudinary / S3 / Firebase Storage |
| Notifications | Email (e.g., Nodemailer)           |

---

## 📦 Project Structure

```
src/
│
├── controllers/    # Route handlers
├── models/         # DB models/schemas
├── routes/         # Express routes
├── services/       # Business logic & utilities
├── middlewares/    # Auth, validation, error handling
├── config/         # DB & environment configs
└── app.js          # Express setup
```

---

## 🔑 Core Features

### 👥 User Management

**Space Owners:**

- Sign up / Login
- Create / Edit / Delete listings

**Clients (No login required):**

- Book spaces by submitting a form with:
  - Name
  - Email
  - Phone number
  - Event Date

### 🏢 Space Listings

- List available spaces
- View detailed info per space
- Multiple images
- Amenities
- Price per hour/day

### 📝 Booking Flow

- "Book Now" form sends booking info to backend
- Saves booking in DB
- Sends email notification to space owner (optional)

---

## 🛠 Setup Instructions

### 1. Clone the Repository

```
git clone https://github.com/your-username/space-rental-backend.git
cd space-rental-backend
```

### 2. Install Dependencies

```
pnpm install
```

> ✅ We're using **pnpm** as the package manager.

### 3. Environment Variables

Create a `.env` file in the root:

```
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

### 4. Run the Development Server

```
pnpm dev
```

### 5. How to generate API docs

```
node swagger.js
```

---

## 🗃️ Database Schema Overview

### `Users` (Space Owners)

| Field    | Type            |
| -------- | --------------- |
| id       | UUID            |
| name     | String          |
| email    | String          |
| password | String (hashed) |

### `Spaces`

| Field       | Type   |
| ----------- | ------ |
| id          | UUID   |
| owner_id    | UUID   |
| name        | String |
| description | Text   |
| location    | String |
| price       | Number |
| images      | Array  |
| amenities   | Array  |

### `Bookings`

| Field      | Type   |
| ---------- | ------ |
| id         | UUID   |
| space_id   | UUID   |
| name       | String |
| email      | String |
| phone      | String |
| event_date | Date   |

---

## 📮 API Endpoints (Example)

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Space Listings

- `GET /api/spaces`
- `GET /api/spaces/:id`
- `POST /api/spaces` (auth required)
- `PUT /api/spaces/:id` (auth required)
- `DELETE /api/spaces/:id` (auth required)

### Bookings

- `POST /api/bookings`

---

## ✅ Next Steps

- [ ] Finalize DB schema
- [ ] Implement CRUD for spaces
- [ ] Implement booking form & endpoint
- [ ] Add email notifications
- [ ] Write unit & integration tests (optional)

---

## 💡 Future Enhancements (Post-MVP)

- Calendar availability
- Stripe payment integration
- Admin dashboard
- Reviews & Ratings
- In-app messaging

---

## 🤝 Contributing

Pull requests and issues are welcome! Please open an issue to discuss changes before submitting PRs.

---

## 📜 License

This project is licensed under the MIT License.

---

## ✨ Acknowledgements

This MVP is part of a space rental platform connecting people with amazing event spaces without the hassle. Built with care and speed.
