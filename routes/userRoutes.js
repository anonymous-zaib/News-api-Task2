const express = require('express');
const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require('../middlewares/auth');
const News = require('../models/News');
const { upload, uploadToFirebase } = require('../middlewares/multer');
const router = express.Router();

router.get('/', (req, res) => {
    res.send({
        message: 'user api working'
    })
})

// reagister route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
         // Check if the email already exists
         const existingUser = await User.findOne({ email });
         if (existingUser) {
             return res.status(400).send({ error: "Email is already taken", status: false });
         }
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).send({ user, message: "user created successfully" });
    }
    catch (err) {
        res.status(400).send({
            error: err
        })
    }
});

// login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('Unable to login, invalid credentials');
        }

        if (!user.isActive) {
            return res.status(403).send({ error: 'Your account has been disabled by the admin' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Unable to login, invalid credentials');
        }

        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.send({ user, token, message: "Logged in successfully" });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// Admin Login Endpoint
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find admin by email
        const admin = await User.findOne({ email, isAdmin: true });

        if (!admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Generate JWT token for admin
        const token = jwt.sign(
            { _id: admin._id.toString() },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' } // Token expiry time
        );

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// profile route
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('profilePicture name email');
        res.send(user);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Update User Profile Picture
router.patch('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
    if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded' });
    }
  
    try {
      const publicUrl = await uploadToFirebase(req.file);
      req.user.profilePicture = publicUrl;
      await req.user.save();
      res.send({ message: 'Profile picture updated', profilePicture: req.user.profilePicture });
    } catch (err) {
        // console.error('Error updating profile picture:', err);
      res.status(500).send({ error: 'Server error' });
    }
  });
  
  router.patch('/updateprofile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password']; // Include password if you want to allow password updates
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
  
    try {
      const user = req.user;
  
      updates.forEach((update) => {
        if (update !== 'password') {
          user[update] = req.body[update];
        }
      });
  
      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 8);
      }
  
      await user.save();
  
      const updatedUser = await User.findById(user._id).select('name email profilePicture');
      res.send(updatedUser);
    } catch (err) {
      res.status(400).send({ error: err.message });
    }
  });
  // Delete User Profile
router.delete('/profile/:id', auth, async (req, res) => {
    const userId = req.params.id;

    try {
        // Verify if the authenticated user ID matches the requested user ID
        if (req.user._id.toString() !== userId) {
            return res.status(403).send({ error: 'Unauthorized' });
        }

        const user = await User.findOneAndDelete({
            _id: userId
        });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        res.send({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: 'Server error' });
    }
});

// Delete User Profile
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
        console.error(err.message);
        res.status(500).send({ error: 'Server error' });
    }
});

// logout route
router.post('/logout', auth, (req, res) => {
    try {
      res.clearCookie('token');
      res.send({ message: 'Logged out successfully', status: true });
    } catch (err) {
      res.status(500).send({ error: 'Server error', status: false });
    }
  });

module.exports = router