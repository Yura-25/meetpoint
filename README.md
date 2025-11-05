# MeetPoint 🎯

A web application for creating and managing events on an interactive map.

## Team Members
- Backend Developer 1: Yura
- Backend Developer 2: Karolina
- Frontend Developer 1: Diana
- Frontend Developer 2: Nazar

## Tech Stack
- **Backend**: Node.js, Express.js, PostgreSQL, Prisma, Socket.io
- **Frontend**: React, Vite, TailwindCSS, Leaflet.js

## Getting Started

### Prerequisites

Before you start, you need to install:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - This installs both Node.js and npm (Node Package Manager)
   - After installing, open a terminal and verify: `node --version` and `npm --version`

2. **PostgreSQL** (for the database)
   - Download from: https://www.postgresql.org/download/
   - Remember the password you set during installation (you'll need it later)

3. **Git** (you probably already have this since you're using Git)
   - Verify with: `git --version`

### Installation Steps

#### 1. Clone the repository (if you haven't already)
```bash
git clone <your-repository-url>
cd meetpoint-1
```

#### 2. Set up Backend

```bash
# Navigate to backend folder
cd backend

# Copy the environment example file
# On Windows PowerShell:
Copy-Item env.example .env
# On Mac/Linux:
# cp env.example .env

# Edit .env file and update DATABASE_URL with your PostgreSQL credentials
# Example: DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/meetpoint?schema=public"

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# Start the development server
npm run dev
```

The backend should now be running on `http://localhost:3000`

#### 3. Set up Frontend

Open a **new terminal window** (keep the backend running):

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Copy the environment example file
# On Windows PowerShell:
Copy-Item env.example .env
# On Mac/Linux:
# cp env.example .env

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend should now be running on `http://localhost:5173`

Open your browser and visit `http://localhost:5173` to see the app!

## Project Structure
```
meetpoint/
├── backend/
│   ├── src/           # Backend source code
│   ├── prisma/        # Database schema and migrations
│   ├── package.json   # Backend dependencies
│   └── env.example    # Environment variables template
├── frontend/
│   ├── src/           # Frontend source code
│   ├── public/        # Static assets
│   ├── package.json   # Frontend dependencies
│   └── env.example    # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Development

### Backend Commands
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client after schema changes
- `npm run prisma:migrate` - Create and run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (change this!)
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)

## Sprint 1 Goals
- ✅ Project structure setup
- ⏳ Authentication system
- ⏳ Event creation and listing
- ⏳ Interactive map with markers
- ⏳ Real-time updates

## Troubleshooting

**Problem: "npm: command not found"**
- Make sure Node.js is installed and restart your terminal

**Problem: Database connection error**
- Check that PostgreSQL is running
- Verify your DATABASE_URL in backend/.env matches your PostgreSQL credentials
- Make sure the database "meetpoint" exists (Prisma will create it automatically)

**Problem: Port already in use**
- Change the PORT in backend/.env or frontend/vite.config.js
- Or close the application using that port
