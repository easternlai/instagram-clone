const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentReplyVoteSchema = new Schema ({
    comment: {
        type: Schema.ObjectId,
        ref: 'Comment'
    },
    votes: [
        {
            author: {
                type: Schema.ObjectId,
                ref: 'User'
            }
        }
    ]
});


const CommentReplyVoteModel = mongoose.model('CommentReplyVote', CommentReplyVoteSchema);

module.exports = CommentReplyVoteModel;