const express = require('express');
const userRouter = express.Router();
const { requireAuth, optionalAuth } = require('../controllers/authController');
const { 
    retrieveUser, 
    retrievePosts,
    bookmarkPost,
    followUser, 
    retrieveFollowing, 
    retrieveFollowers,
    searchUsers,
    confirmUser,
    updateProfile
} = require('../controllers/userController');

userRouter.get('/:username', optionalAuth, retrieveUser);
userRouter.get('/:username/posts/:offset', optionalAuth, retrievePosts);
userRouter.get('/:userId/:offset/following', requireAuth, retrieveFollowing);
userRouter.get('/:userId/:offset/followers', requireAuth, retrieveFollowers);
userRouter.get('/:username/:offset/search', searchUsers);

userRouter.put('/confirm', requireAuth, confirmUser);
userRouter.put('/', requireAuth, updateProfile);

userRouter.post('/:postId/bookmark', requireAuth, bookmarkPost);
userRouter.post('/:userId/follow', requireAuth, followUser);

module.exports = userRouter;