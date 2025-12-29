const express = require('express');
const router = express.Router();
const { Post, User, PostLike, Comment } = require('../models');
const { moderateContent } = require('../utils/moderation');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        { model: User, as: 'author', attributes: ['username'] },
        { 
          model: Comment, 
          as: 'comments', 
          include: [{ model: User, as: 'user', attributes: ['username'] }] 
        },
        { model: PostLike, as: 'likes', attributes: ['userId'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format likes to be an array of userIds to match Mongoose/Frontend expectation
    const formattedPosts = posts.map(post => {
      const p = post.toJSON();
      p.likes = p.likes.map(like => like.userId);
      return p;
    });

    res.json(formattedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { author, content } = req.body; // author is expected to be userId

    // AI Safety Check
    const moderationResult = moderateContent(content);
    let finalContent = content;

    if (!moderationResult.isSafe) {
        if (moderationResult.reasons.includes('harassment')) {
            return res.status(400).json({ error: 'Post blocked: Harassment/Toxic content detected.' });
        }
        // If just profanity, we use the clean text
        finalContent = moderationResult.cleanText;
    }

    const newPost = await Post.create({ 
        authorId: author, 
        content: finalContent 
    });

    // Fetch the created post with author info
    const populatedPost = await Post.findByPk(newPost.id, {
        include: [{ model: User, as: 'author', attributes: ['username'] }]
    });

    // Add empty likes/comments arrays for frontend consistency
    const result = populatedPost.toJSON();
    result.likes = [];
    result.comments = [];

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like a post
router.put('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const postId = req.params.id;

    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existingLike = await PostLike.findOne({ where: { postId, userId } });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
    } else {
      // Like
      await PostLike.create({ postId, userId });
    }
    
    // Fetch updated post to return
    const updatedPost = await Post.findByPk(postId, {
        include: [
            { model: User, as: 'author', attributes: ['username'] },
            { 
              model: Comment, 
              as: 'comments', 
              include: [{ model: User, as: 'user', attributes: ['username'] }] 
            },
            { model: PostLike, as: 'likes', attributes: ['userId'] }
        ]
    });

    const result = updatedPost.toJSON();
    result.likes = result.likes.map(like => like.userId);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
