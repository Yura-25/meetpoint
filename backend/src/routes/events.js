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
    const { title, description, category, latitude, longitude, datetime, maxParticipants, address } = req.body;
    
    const event = await prisma.event.create({
      data: {
        title, 
        description, 
        category: category || 'none',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || "Łódź Location",
        date: new Date(datetime),
        maxMembers: parseInt(maxParticipants),
        creatorId: req.user.id,
        members: { create: { userId: req.user.id } }
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        members: { select: { userId: true } }
      }
    });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(400).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update Event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, description, category, latitude, longitude, datetime, maxParticipants, address } = req.body;

    // Check if event exists and user is creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existingEvent.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }

    // Build update object (only include provided fields)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category || 'none';
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (datetime !== undefined) updateData.date = new Date(datetime);
    if (maxParticipants !== undefined) updateData.maxMembers = parseInt(maxParticipants);
    if (address !== undefined) updateData.address = address;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        members: { select: { userId: true } }
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(400).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete Event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event exists and user is creator
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Delete all event members first (foreign key constraint)
    await prisma.eventMember.deleteMany({
      where: { eventId: eventId }
    });

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(400).json({ error: 'Failed to delete event' });
  }
});

// POST /api/events/:id/join - Join Event
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { members: true }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.members.length >= event.maxMembers) {
      return res.status(400).json({ error: 'Event is full' });
    }

    await prisma.eventMember.create({
      data: { userId, eventId }
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2002') return res.json({ success: true });
    res.status(500).json({ error: 'Could not join event' });
  }
});

// DELETE /api/events/:id/join - Leave Event
router.delete('/:id/join', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    await prisma.eventMember.deleteMany({
      where: { eventId, userId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Could not leave event' });
  }
});

export default router;