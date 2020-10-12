const User = require('../models/User');
// const Post = require("../models/Post");
const Followers = require('../models/Followers');
const Following = require('../models/Following');
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs');
const crypto = require('crypto');



module.exports.retrieveUser = async (req, res, next ) => {
    const { username } = req.params;

    //Tracks requesting user.
    const requestingUser = res.locals.user;
    try {
        const user = await User.findOne(
            {username},
            'username fullName avatar bio bookmarks fullName _id website'
            );

            if (!user) {
                return res
                    .status(404)
                    .send({ error: 'Could not find a user with that username'});
            }

            // const posts = await Post.aggregate([
            //     {
            //         $facet:{
            //             data: [
            //                 { $match: { author: ObjectId(user._id )}},
            //                 { $sort: { date: -1 } },
            //                 { $limit: 12 },
            //                 {
            //                     $lookup: {
            //                         from: 'postvotes',
            //                         localField: '_id',
            //                         foreignField: 'post',
            //                         as: 'postvotes'
            //                     }
            //                 },
            //                 {
            //                     $lookup: {
            //                         from: 'comments',
            //                         localField: '_id',
            //                         foreignField: 'post',
            //                         as: 'comments'
            //                     },
            //                 },
            //                 { 
            //                     $lookup: {
            //                         from: 'commentreplies',
            //                         localField: 'comments._id',
            //                         foreignField: 'parentComment',
            //                         as: 'commentReplies'
            //                     }
            //                 },
            //                 {
            //                     $unwind: '$postvotes',
            //                 },
            //                 {
            //                     $addFields: { image: '$thumbnail' }
            //                 },
            //                 {
            //                     $project: {
            //                         user: true,
            //                         followers: true,
            //                         following: true,
            //                         comments: { 
            //                             $sum: [{ $size: 'comments'}, {$size: "commentReplies" }]
            //                         },
            //                         image: true,
            //                         thumbnail: true,
            //                         filter: true,
            //                         caption: true,
            //                         author: true,
            //                         postVotes: { $size: '$postvotes.votes'}
            //                     }
            //                 }
            //             ],
            //             postCount: [
            //                 { $match: { author: ObjectId(user._id) } },
            //                 { $count: 'postCount' },
            //             ]
            //         }
            //     },
            //     { $unwind: '$postCount'},
            //     {
            //         $project: {
            //             data: true,
            //             postCount: '$postCount.postCount',
            //         }
            //     }
            // ]);
            // const followersDocument = await Followers.findOne({
            //     user: ObjectId(user._id)
            // });

            // const followingDocument = await Following.findOne({
            //     user: ObjectId(user._id)
            // });

            return res.send({
                user,
                // followers: followersDocument.followers.length,
                // following: followingDocument.following.length,
                // // Check if the requestin user follows the retrived user
                // isFollowing: requestingUser 
                //     ? !!followersDocument.followers.find( 
                //         (follower) => String(follower.user) === String(requestingUser._id)
                //     )
                //     : false,
                // posts: posts[0]
            });
    } catch (err) {
        next(err)
    }
};

// module.exports.confirmUser = async (req, res, next) => {
//     const { token } = req.body;
//     const user = res.locals.users;

//     try {
        
//     } catch (err) {
//         const confirmToken = await confirmToken.findOne({
//             token,
//             user: user._id
//         })
//     }
// };

module.exports.followUser = async (req, res, next) => {

    const { userId } = req.params;
    const user = res.locals.user;


    try {
        const userToFollow = await User.findById(userId);
        if(!userToFollow) {
            return res
                .status(400)
                .send({ error: 'Could not find a user with that id.' });
        }
        console.log(userToFollow);
        const followerUpdate = await Followers.updateOne(
            { user: userId, 'followers.user': { $ne: user._id } },
            { $push: { followers: { user: user._id } } }
          );

          


        const followingUpdate = await Following.updateOne(
            {user: user._id, 'following.user': { $ne: userId  }},
            {$push: { following: { user: userId }}}
        );

        if(!followerUpdate.nModified || !followingUpdate.nModified ) {
            if (!followerUpdate.ok ||!followingUpdate.ok) {
                return res
                    .status(500)
                    .send({ error: ' Could not follow user please try again later.'});
            }
            // Nothing was modified in the above query meaning that the user is already following
            // Unfollow instead
            const followerUnfollowUpdate = await Followers.updateOne (
                { 
                    user: userId
                },
                { $pull: { followers: { user: user._id } } }
            );

            const followingUnfollowUpdate = await Following.updateOne(
                { user: user._id},
                {$pull: { following: { user: userId } } }
            );
            if (!followerUnfollowUpdate.ok || !followingUnfollowUpdate.ok) {
                return res
                    .status(500)
                    .send({ error: 'Could not follow user please try again later.'} );
            }
            return res.send({ success: true, operation: 'unfollow' });
        }

        res.send({ success: true, operation: 'follow' });

    } catch (err) {
        next(err);
    }

}