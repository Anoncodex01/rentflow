// Image upload route for Supabase Storage
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.use(authMiddleware);

// POST /api/upload/room-image
router.post('/room-image', async (req, res) => {
  try {
    const { image, roomId } = req.body; // image is base64 data URL
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = image.match(/^data:image\/(\w+);base64/)?.[1] || 'jpg';
    const fileName = `room-${roomId || 'temp'}-${timestamp}-${randomString}.${fileExt}`;
    const filePath = `rooms/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      // If bucket doesn't exist, fall back to storing base64 in database
      return res.status(500).json({ 
        error: 'Upload failed. Using base64 storage instead.',
        fallback: true,
        base64: image
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('room-images')
      .getPublicUrl(filePath);

    res.json({
      url: urlData.publicUrl,
      path: filePath
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
