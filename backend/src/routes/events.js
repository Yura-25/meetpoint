import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events - Get all events (Public)
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'active' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        members: { select: { userId: true } } // Fetch existing 'members' relation
      },
      orderBy: { date: 'asc' }
    });

    // TRANSFORM DATA: Map DB fields to Frontend expected fields
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      latitude: event.latitude,
      longitude: event.longitude,
      address: event.address,
      
      // MAPPINGS
      datetime: event.date,                // db: date -> front: datetime
      maxParticipants: event.maxMembers,   // db: maxMembers -> front: maxParticipants
      participants: event.members.map(m => m.userId), // db: members -> front: participants array
      
      creator: { 
        id: event.creator.id,
        username: event.creator.name,      // db: name -> front: username
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

// POST /api/events - Create Event (Protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Frontend sends 'datetime' and 'maxParticipants'
    const { title, description, category, latitude, longitude, datetime, maxParticipants } = req.body;

    // We map them back to 'date' and 'maxMembers' for your DB
    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: "Łódź Location", // Default or reverse geocode later
        
        // MAPPING
        date: new Date(datetime),
        maxMembers: parseInt(maxParticipants),
        
        creatorId: req.user.id,
        
        // Automatically add creator to 'members'
        members: {
          create: { userId: req.user.id }
        }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(400).json({ error: 'Failed to create event' });
  }
});

export default router;