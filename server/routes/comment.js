const express = require('express');
const commentRouter = express.Router();

const { requireAuth } = require('../controllers/authController');

const {
    createComment,
    voteComment,
    createCommentReply,
    voteCommentReply
} = require('../controllers/commentController');

commentRouter.post('/:postId', requireAuth, createComment);
commentRouter.post('/:commentId/vote', requireAuth, voteComment);
commentRouter.post('/:commentReplyId/replyVote', requireAuth, voteCommentReply);
commentRouter.post('/:parentCommentId/reply', requireAuth, createCommentReply);

module.exports = commentRouter;