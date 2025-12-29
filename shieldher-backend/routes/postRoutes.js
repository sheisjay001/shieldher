const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { moderateContent } = require('../utils/moderation');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .populate('comments.user', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { author, content } = req.body;

    // AI Safety Check
    const moderationResult = moderateContent(content);
    if (!moderationResult.isSafe) {
        if (moderationResult.reasons.includes('harassment')) {
            return res.status(400).json({ error: 'Post blocked: Harassment/Toxic content detected.' });
        }
        // If just profanity, we use the clean text
        const newPost = new Post({ author, content: moderationResult.cleanText });
        await newPost.save();
        const populatedPost = await newPost.populate('author', 'username');
        return res.status(201).json(populatedPost);
    }

    const newPost = new Post({ author, content });
    await newPost.save();
    const populatedPost = await newPost.populate('author', 'username');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a post
router.put('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
