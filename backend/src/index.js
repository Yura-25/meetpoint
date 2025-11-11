import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import bcrypt from 'bcrypt'; 


dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ===== Registration endpoint =====
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Get all events
app.get('/api/events', async (req, res) => {
  const events = await prisma.event.findMany({ include: { author: true }});
  res.json(events);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'MeetPoint API is running!' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});