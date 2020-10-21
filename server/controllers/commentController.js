const Comment = require('../models/Comment');
const CommentVote = require('../models/CommentVote');
const CommentReply = require('../models/CommentReply');
const CommentReplyVote = require('../models/CommentReplyVote');
const Post = require('../models/Post');
const CommentReplyVoteModel = require('../models/CommentReplyVote');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports.createComment = async ( req, res, next ) => {

    const {postId} = req.params;
    const { message } = req.body;
    const user = res.locals.user;
    let post = undefined;

  
    if(!message){
        return res.status(400).send({ error: 'Please provide a message with your comment.' })
    }   
    if(!postId){
        return res.status(400).send({ error: 'Please provide the id of the post you would like to comment on. '});
    }

    try {
        post = await Post.findById(postId);
        if(!post){
            return res.status(404).send({ error: 'Could not find a post with this post id. '});
        }

        const comment = new Comment({message, author: user._id, post: postId });
        await comment.save();
        res.status(201).send({
            ...comment.toObject(),
            author: { username: user.username, avatar: user.avatar },
            commentVotes: []
        })
    } catch (err) {
        next(err);
    }

    //***NOTIFICATION CODE */
}

module.exports.voteComment = async (req, res, next ) => {
    const {commentId} = req.params;
    const user = res.locals.user;


    try {
        const commentLikeUpdate = await CommentVote.updateOne(
            {
                comment: commentId,
                'votes.author': {$ne: user._id}
            },
            {$push: { votes: { author: user._id } } }
        );
        
        if(!commentLikeUpdate.nModified){
            if(!commentLikeUpdate.ok){
                return res.status(500).send({ error: 'Could not vote on the comment. '} );
            }
            const commentDislikeUpdate = await CommentVote.updateOne(
                { comment: commentId},
                {$pull: { votes: { author: user._id } } }
            );

            if(!commentDislikeUpdate.nModified) {
                return res.status(500).send({ error: " Could not vote on the comment 2. "} );
            }
        }
        return res.send({ success: true } );
    } catch (err) {
        next(err);
    }
}

module.exports.createCommentReply = async (req, res, next) => {
    const { parentCommentId } = req.params;
    const { message } = req.body;
    const user = res.locals.user;

    if(!message){
        return res.status(400).send({error: 'Please provide a message with your comment'});
    }
    if(!parentCommentId){
        return res.status(400).send({message: 'Please provide the id of the comment you would like to reply to'});
    }

    try {
        const comment = await Comment.findById(parentCommentId);
        if(!comment){
            return res.status(404).send({ error: 'Could not find a parent comment with that id.' });
        }

        
        const commentReply = new CommentReply({
            parentComment: parentCommentId,
            message,
            author: user._id
        });

        await commentReply.save();

        res.status(201).send({
            ...commentReply.toObject(),
            author: { username: user.username, avatar: user.avatar },
            commentReplyVotes: []
        });
    } catch (err) {
        next(err);
    }

    //**NOTIFICATION CODE  */
}

module.exports.voteCommentReply =async (req, res, next ) => {

    const {commentReplyId} = req.params;
    const user = res.locals.user;
    console.log(commentReplyId);

    try {
        const commentReplyLikeUpdate = await CommentReplyVote.updateOne(
            {
                comment: commentReplyId ,
                'votes.author': {$ne: user._id }
            },
            { $push: {votes: { author: user._id } } }
        );

        const testGrab = await CommentReplyVote.findOne({ comment: commentReplyId});
        console.log(testGrab);

        if(!commentReplyLikeUpdate.nModified){
            if(!commentReplyLikeUpdate.ok){
                return res.status(500).send({error: 'Coulc not vote on the comment reply. 1'});
            }
            const commentReplyDislikeUpdate = await CommentReplyVote.updateOne(
                { comment: commentReplyId},
                { $pull: { votes: { author: user._id } } }
            );
            if(!commentReplyDislikeUpdate.nModified){
                return res.status(500).send({ error: 'Could not vote for the comment reply '});
            }
        }
        return res.send({success: true });

    } catch (err) {
        next(err);
    }

}

