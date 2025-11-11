import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken, optionalAuth } from './middleware/auth.js';

dotenv.config();

// Warn if JWT_SECRET is not set (security check)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set in environment variables!');
  console.warn('   Using default secret for development. Change this in production!');
}

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
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        interests: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      user,
      token,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Login endpoint =====
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password) and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        interests: user.interests,
        createdAt: user.createdAt,
      },
      token,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Get current user (protected route) =====
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ===== Users endpoints =====
// Get all users (protected - optional, can be public if needed)
app.get('/api/users', optionalAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        interests: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', optionalAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        interests: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Events endpoints =====
// Get all events (public, but can show additional info if authenticated)
app.get('/api/events', optionalAuth, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          }
        },
        members: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add member count to each event
    const eventsWithCounts = events.map(event => ({
      ...event,
      memberCount: event._count.members,
      hasSpace: event._count.members < event.maxMembers,
    }));

    res.json(eventsWithCounts);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event by ID
app.get('/api/events/:id', optionalAuth, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      ...event,
      memberCount: event._count.members,
      hasSpace: event._count.members < event.maxMembers,
    });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event (protected route)
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const { title, description, date, latitude, longitude, maxMembers, category, tags } = req.body;

    // Validation
    if (!title || !description || !date || latitude === undefined || longitude === undefined || !category) {
      return res.status(400).json({ error: 'Title, description, date, location (lat/lng), and category are required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        maxMembers: maxMembers || 10,
        category,
        tags: tags || [],
        creatorId: req.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    res.status(201).json({
      ...event,
      memberCount: event._count.members,
      hasSpace: true,
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join event (protected route)
app.post('/api/events/:id/join', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is full
    if (event._count.members >= event.maxMembers) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check if user is already a member
    const existingMember = await prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this event' });
    }

    // Check if user is the creator
    if (event.creatorId === userId) {
      return res.status(400).json({ error: 'You are the creator of this event' });
    }

    // Add user to event
    const eventMember = await prisma.eventMember.create({
      data: {
        userId,
        eventId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        event: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Successfully joined event',
      eventMember,
      event: {
        ...eventMember.event,
        memberCount: eventMember.event._count.members,
        hasSpace: eventMember.event._count.members < eventMember.event.maxMembers,
      }
    });
  } catch (err) {
    console.error('Error joining event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave event (protected route)
app.delete('/api/events/:id/leave', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is a member
    const eventMember = await prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    if (!eventMember) {
      return res.status(400).json({ error: 'You are not a member of this event' });
    }

    // Remove user from event
    await prisma.eventMember.delete({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    res.json({ message: 'Successfully left event' });
  } catch (err) {
    console.error('Error leaving event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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