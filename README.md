# MeetPoint

A web app for discovering and joining local social events on a map. Users can create events at an address, browse them on an interactive map, join or leave events, add friends, and edit their profile.

## Stack

- **Frontend:** HTML, CSS, JavaScript, Leaflet + OpenStreetMap (address geocoding via Nominatim)
- **Backend:** Node.js, Express, JWT authentication
- **Database:** PostgreSQL with Prisma ORM

## Running locally

1. Install Node.js and PostgreSQL, then create a database.
2. In `backend/`, copy `env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET`.
3. Install dependencies and apply migrations:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   ```
4. Optionally seed sample data: `node src/seed.js`
5. Start the API: `npm run dev` (runs on http://localhost:3000)
6. Open `index.html` in the browser.

See `TESTING.md` for API testing steps.
