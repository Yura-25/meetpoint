import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// PUT /api/profile - Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, avatar } = req.body;

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        interests: true,
        createdAt: true
      }
    });

    res.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;