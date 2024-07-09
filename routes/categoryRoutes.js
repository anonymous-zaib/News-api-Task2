const express = require('express')
const Category = require('../models/Category')
const adminAuth = require('../middlewares/adminAuth');
// const auth = require('../middlewares/auth')
const router = express.Router();

// Create Category
router.post('/createcategory', adminAuth, async (req, res) => {
    try {
        const { name } = req.body;
        const category = new Category({ name });
        await category.save();
        res.status(201).send({ category, message: "Category created successfully" });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// Read all categories
router.get('/getcategory', async (req, res) => {
    try {
        const categories = await Category.find();
        res.send(categories);
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

// Update Category
router.patch('/updatecategory:id', adminAuth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name'];
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }

        updates.forEach((update) => (category[update] = req.body[update]));
        await category.save();
        res.send({ category, message: "Category updated successfully" });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// Delete Category
router.delete('/deletecategory:id', adminAuth, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }
        res.send({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

module.exports = router