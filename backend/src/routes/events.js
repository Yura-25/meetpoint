import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'active' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        members: { select: { userId: true } }
      },
      orderBy: { date: 'asc' }
    });

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      latitude: event.latitude,
      longitude: event.longitude,
      address: event.address,
      datetime: event.date,
      maxParticipants: event.maxMembers,
      participants: event.members.map(m => m.userId),
      creator: { 
        id: event.creator.id,
        username: event.creator.name,
        avatar: event.creator.avatar
      },
      status: event.status
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create Event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, datetime, maxParticipants } = req.body;
    const event = await prisma.event.create({
      data: {
        title, description, category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: "Łódź Location",
        date: new Date(datetime),
        maxMembers: parseInt(maxParticipants),
        creatorId: req.user.id,
        members: { create: { userId: req.user.id } }
      }
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create event' });
  }
});

// --- ADDED MISSING JOIN/LEAVE ENDPOINTS ---

// POST /api/events/:id/join
router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        // Check if full
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { members: true }
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });
        if (event.members.length >= event.maxMembers) {
            return res.status(400).json({ error: 'Event is full' });
        }

        await prisma.member.create({
            data: { userId, eventId }
        });

        res.json({ success: true });
    } catch (error) {
        // Ignore duplicate join error
        if (error.code === 'P2002') return res.json({ success: true });
        res.status(500).json({ error: 'Could not join event' });
    }
});

// DELETE /api/events/:id/join (Leave event)
router.delete('/:id/join', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        await prisma.member.deleteMany({
            where: {
                eventId: eventId,
                userId: userId
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Could not leave event' });
    }
});

export default router;