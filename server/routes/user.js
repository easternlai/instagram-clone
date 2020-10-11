const express = require('express');
const userRouter = express.Router();
const { requireAuth, optionalAuth } = require('../controllers/authController');
const { retrieveUser, confirmUser} = require('../controllers/userController');

userRouter.get('/:username', optionalAuth, retrieveUser);
// userRouter.put('/confirm', requireAuth, confirmUser);

module.exports = userRouter;