import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/friends - Get user's friends
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get accepted friendships where user is either the sender or receiver
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        friend: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Map to get the friend (not the current user)
    const friends = friendships.map(f => {
      return f.userId === userId ? f.friend : f.user;
    });

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// POST /api/friends - Add friend by email
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user by email
    const friendUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    if (!friendUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (friendUser.id === userId) {
      return res.status(400).json({ error: "You can't add yourself as a friend" });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: friendUser.id },
          { userId: friendUser.id, friendId: userId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Friendship already exists' });
    }

    // Create friendship (auto-accepted for simplicity)
    const friendship = await prisma.friendship.create({
      data: {
        userId: userId,
        friendId: friendUser.id,
        status: 'accepted'
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Friend added',
      friend: friendUser 
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// DELETE /api/friends/:friendId - Remove friend
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // Delete the friendship (either direction)
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

export default router;