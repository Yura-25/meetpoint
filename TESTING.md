# Testing Guide for MeetPoint Backend

## ✅ Setup Complete!

All your changes have been saved locally and committed. Here's how to test your code:

## 📋 Prerequisites

1. **Node.js** - Already installed ✓
2. **PostgreSQL Database** - Already set up ✓
3. **Dependencies** - Already installed ✓
4. **Database Migrations** - Already run ✓

## 🚀 How to Test

### 1. Start the Backend Server

Open a terminal in the `backend` folder and run:

```bash
# Development mode (auto-restarts on changes)
npm run dev

# OR production mode
npm start
```

The server will start on **http://localhost:3000**

### 2. Seed the Database (Optional)

If you want to add test data (user + 3 events in Łódź):

```bash
node src/seed.js
```

This creates:
- User: `lodz@meetpoint.com` / Password: `123456`
- 3 sample events in Łódź

### 3. Test the API Endpoints

#### **Test 1: Check if server is running**
```bash
curl http://localhost:3000/
```
Expected: `{"message":"MeetPoint API (Sprint 1) is running!"}`

#### **Test 2: Get all events (Public)**
```bash
curl http://localhost:3000/api/events
```
Expected: Array of events (empty if no seed data, or 3 events if seeded)

#### **Test 3: Register a new user**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"123456\",\"name\":\"Test User\"}"
```
Expected: User object + JWT token

#### **Test 4: Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"123456\"}"
```
Expected: User object + JWT token

#### **Test 5: Get current user (Protected)**
```bash
# Replace YOUR_TOKEN with the token from login/register
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: User object

#### **Test 6: Create an event (Protected)**
```bash
# Replace YOUR_TOKEN with the token from login/register
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"title\":\"Test Event\",\"description\":\"Test Description\",\"category\":\"tech\",\"latitude\":51.7592,\"longitude\":19.4560,\"datetime\":\"2024-12-01T18:00:00\",\"maxParticipants\":5}"
```
Expected: Created event object

## 🧪 Using Postman or Thunder Client

1. Import these endpoints:
   - `GET http://localhost:3000/` - Health check
   - `GET http://localhost:3000/api/events` - Get all events
   - `POST http://localhost:3000/api/auth/register` - Register
   - `POST http://localhost:3000/api/auth/login` - Login
   - `GET http://localhost:3000/api/auth/me` - Get current user (needs Bearer token)
   - `POST http://localhost:3000/api/events` - Create event (needs Bearer token)

2. For protected routes, add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`

## 📁 Your Files Are Saved

All your changes are committed locally:
- ✅ `backend/src/routes/events.js` - Events API routes
- ✅ `backend/src/seed.js` - Database seeding script
- ✅ `backend/src/index.js` - Main server file (fixed)

## 🔍 View Database

To see your database in a GUI:

```bash
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555

## 🐛 Troubleshooting

**Server won't start?**
- Check if port 3000 is already in use
- Verify `.env` file exists in `backend/` folder
- Check database connection in `.env` file

**Database errors?**
- Run `npm run prisma:migrate` to apply migrations
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct

**Can't create events?**
- Make sure you're logged in and using a valid JWT token
- Check the Authorization header format: `Bearer TOKEN`

## 📝 Next Steps

1. Start the server: `npm run dev`
2. Test endpoints using curl, Postman, or your frontend
3. Check Prisma Studio to see data in the database

Your code is ready to test! 🎉

