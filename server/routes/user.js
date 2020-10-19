const express = require('express');
const userRouter = express.Router();
const { requireAuth, optionalAuth } = require('../controllers/authController');
const { retrieveUser, confirmUser, followUser, retrieveFollowing, retrieveFollowers} = require('../controllers/userController');

userRouter.get('/:username', optionalAuth, retrieveUser);
userRouter.get('/:userId/:offset/following', requireAuth, retrieveFollowing);
userRouter.get('/:userId/:offset/followers', requireAuth, retrieveFollowers);

userRouter.post('/:userId/follow', requireAuth, followUser);
// userRouter.put('/confirm', requireAuth, confirmUser);

module.exports = userRouter;