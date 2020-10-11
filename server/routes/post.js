const express = require('express');
const postRouter = express.Router();
const multer = require('multer');
const upload = multer({ 
    dest: 'temp/',
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('image');
const rateLimit = require('express-rate-limit');

const { requireAuth } = require('../controllers/authController');
const {
    createPost
} = require('../controllers/postController');

const postLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5
});

postRouter.post('/', postLimiter, requireAuth, upload, createPost);

module.exports = postRouter;