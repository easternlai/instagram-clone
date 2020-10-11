const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentVoteSchema = new Schema ({
    comment : {
        type: Schema.ObjectId,
        ref: 'Comment'
    },
    vote: [
        {
            author: {
                type: Schema.Object,
                ref: 'User'
            }
        }
    ]
});

const CommentVoteModel = mongoose.model('CommentVote', CommentVoteSchema);
module.exports = CommentVoteModel;