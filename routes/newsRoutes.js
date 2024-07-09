const express = require('express');
const News = require('../models/News');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middlewares/adminAuth');
const auth = require('../middlewares/auth')
const { upload, uploadToFirebase } = require('../middlewares/multer');
const router = express.Router();


router.post('/createnews', adminAuth, upload.single('newsImage'), async (req, res) => {
    try {
      const { title, content, category } = req.body;
  
      // Upload the image to Firebase if it exists
      const publicUrl = req.file ? await uploadToFirebase(req.file) : null;
  
      // Create the news post
      const newsPost = new News({
        title,
        content,
        category,
        author: req.user._id,
        image: publicUrl,
      });
  
      await newsPost.save();
  
      res.status(201).send({ newsPost, message: 'News post created successfully' });
    } catch (err) {
      res.status(400).send({ error: err.message });
    }
  });

// Read all news (Public)
router.get('/getnews', async (req, res) => {
    try {
        const newsList = await News.find().populate('category').populate('author', 'name');
        res.send(newsList);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Read news by category (Public)
router.get('/category/:categoryId', async (req, res) => {
    try {
        const newsList = await News.find({ category: req.params.categoryId }).populate('category').populate('author', 'name email');
        res.send(newsList);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Update News (Admin Only)
router.patch('/updatenews:id', adminAuth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'content', 'category'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).send({ error: 'News not found' });
        }

        updates.forEach((update) => (news[update] = req.body[update]));
        await news.save();
        res.send({ news, message: "News updated successfully" });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// Delete News (Admin Only)
router.delete('/deletenews:id', adminAuth, async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) {
            return res.status(404).send({ error: 'News not found' });
        }
        res.send({ message: 'News deleted successfully' });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Get all users (Admin only)
router.get('/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('name email isActive');
        res.send(users);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Enable or disable a user (Admin only)
router.patch('/admin/users/:id/toggle', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        user.isActive = !user.isActive;
        await user.save();
        res.send({ message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully`, user });
    } catch (err) {
        res.status(400).send({ error: 'Server error' });
    }
})
;
// like a post
router.post('/newspost/:id/like', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        if (!post.likes.includes(req.user._id)) {
            post.likes.push(req.user._id);
            post.dislikes = post.dislikes.filter(userId => !userId.equals(req.user._id));
        }
        await post.save();
        res.send({ message: 'Post liked', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Dislike a post
router.post('/newspost/:id/dislike', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        if (!post.dislikes.includes(req.user._id)) {
            post.dislikes.push(req.user._id);
            post.likes = post.likes.filter(userId => !userId.equals(req.user._id));
        }
        await post.save();
        res.send({ message: 'Post disliked', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Mark post as favorite
router.post('/newspost/:id/favorite', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        if (!post.favorites.includes(req.user._id)) {
            post.favorites.push(req.user._id);
        } else {
            post.favorites = post.favorites.filter(userId => !userId.equals(req.user._id));
        }
        await post.save();
        res.send({ message: 'Post favorite status toggled', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Add a comment to a post
router.post('/newspost/:id/comment', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        const comment = {
            user: req.user._id,
            content: req.body.content,
        };
        post.comments.push(comment);
        await post.save();
        res.send({ message: 'Comment added', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Edit a comment
router.patch('/newspost/:postId/comment/:commentId', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.postId);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        const comment = post.comments.id(req.params.commentId);
        if (!comment || !comment.user.equals(req.user._id)) {
            return res.status(404).send({ error: 'Comment not found or unauthorized' });
        }
        comment.content = req.body.content;
        await post.save();
        res.send({ message: 'Comment updated', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Delete a comment
router.delete('/newspost/:postId/comment/:commentId', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.postId);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).send({ error: 'Comment not found' });
        }

        if (!comment.user.equals(req.user._id)) {
            return res.status(403).send({ error: 'Unauthorized action' });
        }

        post.comments.pull({ _id: req.params.commentId });
        await post.save();

        res.send({ message: 'Comment deleted', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});
// Fetch all comments of a post
router.get('/newspost/:postId/comments', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.postId).populate('comments.user', 'name email');
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }
        res.send(post.comments);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});
// Report a post
router.post('/newspost/:postId/report', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        const post = await News.findById(req.params.postId);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }

        const report = {
            reportedBy: req.user._id,
            reason,
        };

        post.reports.push(report);
        await post.save();
        res.status(201).send({ message: 'Post reported', post });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});
// Admin view reported posts
router.get('/reports', adminAuth, async (req, res) => {
    try {
        const reports = await News.find({ 'reports.0': { $exists: true } })
            .populate('reports.reportedBy', 'name email')
            .populate('author', 'name email')
            .populate('category', 'name');

        res.send(reports);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

router.post('/sharepost/:postId', auth, async (req, res) => {
    try {
        const post = await News.findById(req.params.postId);
        if (!post) {
            return res.status(404).send({ error: 'Post not found' });
        }

        // Increase the share count
        post.shares = post.shares ? post.shares + 1 : 1;
        await post.save();

        // Generate a shareable link with a query parameter
        const shareableLink = `${req.protocol}://${req.get('host')}/news/${post._id}?sharedBy=${req.user._id}`;

        res.status(200).send({ message: 'Post shared successfully', shareableLink });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});
module.exports = router