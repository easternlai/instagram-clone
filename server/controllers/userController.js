const User = require("../models/User");
const Post = require("../models/Post");
const Followers = require("../models/Followers");
const Following = require("../models/Following");
const ConfirmationToken = require('../models/ConfirmationToken');
const ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");
const crypto = require("crypto");

const { 
  validateEmail,
  validateFullName,
  validateUsername,
  validateBio,
  validateWebsite
} = require('../utils/validation');

module.exports.retrieveUser = async (req, res, next) => {
  const { username } = req.params;

  //Tracks requesting user.
  const requestingUser = res.locals.user;
  try {
    const user = await User.findOne(
      { username },
      "username fullName avatar bio bookmarks fullName _id website"
    );

    if (!user) {
      return res
        .status(404)
        .send({ error: "Could not find a user with that username" });
    }

    const posts = await Post.aggregate([
      {
        $facet: {
          data: [
            { $match: { author: ObjectId(user._id) } },
            { $sort: { date: -1 } },
            { $limit: 12 },
            {
              $lookup: {
                from: 'postvotes',
                localField: '_id',
                foreignField: 'post',
                as: 'postvotes',
              },
            },
            {
              $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'post',
                as: 'comments',
              },
            },
            {
              $lookup: {
                from: 'commentreplies',
                localField: 'comments._id',
                foreignField: 'parentComment',
                as: 'commentReplies',
              },
            },
            {
              $unwind: '$postvotes',
            },
            {
              $addFields: { image: '$thumbnail' },
            },
            {
              $project: {
                user: true,
                followers: true,
                following: true,
                comments: {
                  $sum: [{ $size: '$comments' }, { $size: '$commentReplies' }],
                },
                image: true,
                thumbnail: true,
                filter: true,
                caption: true,
                author: true,
                postVotes: { $size: '$postvotes.votes' },
              },
            },
          ],
          postCount: [
            { $match: { author: ObjectId(user._id) } },
            { $count: 'postCount' },
          ],
        },
      },
      { $unwind: '$postCount' },
      {
        $project: {
          data: true,
          postCount: '$postCount.postCount',
        },
      },
    ]);
    const followersDocument = await Followers.findOne({
        user: ObjectId(user._id)
    });

    const followingDocument = await Following.findOne({
        user: ObjectId(user._id)
    });

    return res.send({
      user,
      followers: followersDocument.followers.length,
      following: followingDocument.following.length,
      // Check if the requestin user follows the retrived user
      isFollowing: requestingUser
          ? !!followersDocument.followers.find(
              (follower) => String(follower.user) === String(requestingUser._id)
          )
          : false,
      posts: posts[0]
    });
  } catch (err) {
    next(err);
  }
};



module.exports.followUser = async (req, res, next) => {
  const { userId } = req.params;
  const user = res.locals.user;

  try {
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res
        .status(400)
        .send({ error: "Could not find a user with that id." });
    }

    const followerUpdate = await Followers.updateOne(
      { user: userId, "followers.user": { $ne: user._id } },
      { $push: { followers: { user: user._id } } }
    );

    const followingUpdate = await Following.updateOne(
      { user: user._id, "following.user": { $ne: userId } },
      { $push: { following: { user: userId } } }
    );

    if (!followerUpdate.nModified || !followingUpdate.nModified) {
      if (!followerUpdate.ok || !followingUpdate.ok) {
        return res
          .status(500)
          .send({ error: " Could not follow user please try again later." });
      }
      // Nothing was modified in the above query meaning that the user is already following
      // Unfollow instead
      const followerUnfollowUpdate = await Followers.updateOne(
        {
          user: userId,
        },
        { $pull: { followers: { user: user._id } } }
      );

      const followingUnfollowUpdate = await Following.updateOne(
        { user: user._id },
        { $pull: { following: { user: userId } } }
      );
      if (!followerUnfollowUpdate.ok || !followingUnfollowUpdate.ok) {
        return res
          .status(500)
          .send({ error: "Could not follow user please try again later." });
      }
      return res.send({ success: true, operation: "unfollow" });
    }

    res.send({ success: true, operation: "follow" });
  } catch (err) {
    next(err);
  }
};

const retrieveRelatedUsers = async (user, userId, offset, followers) => {
  const pipeline = [
    {
      $match: { user: ObjectId(userId) },
    },
    {
      $lookup: {
        from: "users",
        let: followers
          ? { userId: "$followers.user" }
          : { userId: "$following.user" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$userId"] },
            },
          },
          {
            $skip: Number(offset),
          },
          {
            $limit: 10,
          },
        ],
        as: "users",
      },
    },
    {
        $lookup: {
            from: 'followers',
            localField: 'users._id',
            foreignField: 'user',
            as: 'userFollowers'
        }
    },
    {
        $project: {
            'users._id': true,
            'users.username': true,
            'users.avatar': true,
            'users.fullName': true,
            userFollowers: true
        }
    }
  ];

  const aggregation = followers
    ? await Followers.aggregate(pipeline)
    : await Following.aggregate(pipeline);

  // Make a set to store the IDs fo the followed users

  const followedUsers = new Set();
  //Loop through every follower and add the id to the set if the user's id is in the array
  aggregation[0].userFollowers.forEach((followingUser) => {
    if (
        !!followingUser.followers.find(
            (follower) => String(follower.user) === String(user._id)
        )
    ) {
        followedUsers.add(String(followingUser.user));
      }
  });
  // Add the isFolowing key to the following object with a value
  // Depending on the outcome of the loop above
  aggregation[0].users.forEach((followingUser) => {
      followingUser.isFollowing = followedUsers.has(String(followingUser._id));
  }); 
  
  return aggregation[0].users;
};

module.exports.retrievePosts = async ( req, res, next ) => {
  // Retlieve a user's posts with the post's comments & likes
  const { username, offset = 0} = req.params;
  
  try {
    const posts = await Post.aggregate([
      { $sort: { date: -1}},
      { $skip: Number(offset)},
      { $limit: 12 },
        { $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'user'  
        }
      },
      { $match: { 'user.username': username } },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'postvotes',
          localField: '_id',
          foreignField: 'post',
          as: 'postVotes'
        }
      },
      { $unwind: '$postVotes'},
      {
        $project: {
          image: true,
          caption: true,
          date: true,
          'user.username': true,
          'user.avatar': true,
          comments: { $size: '$comments' },
          postVotes: { $size: '$postVotes.votes'}
        }
      }
    ]);
    if (posts.length === 0) {
      return res.status(404).send({ error: 'Could not find any posts.' });
    }
    return res.send(posts);
  } catch (err) {
    next(err);    
  }
}

module.exports.bookmarkPost = async (req, res, next) => {
  const {postId} = req.params;
  const user = res.locals.user;

  try {
    const post = await Post.findById(postId);
    if(!post){
      return res.status(404).send({error: "Could not find a post with this Id. "});
    }

    const userBookmarkUpdate = await User.updateOne(
      {
        _id: user._id,
        'bookmarks.post': { $ne: postId}
      },
      {$push: {bookmarks: {post: postId }}}
    );

    console.log(userBookmarkUpdate);

    if(!userBookmarkUpdate.nModified){
      if(!userBookmarkUpdate.ok){
        return res.status(500).send({ error: "Could not bookmark this post. "});
      }
      const userRemoveBookmarkUpdate = await User.updateOne(
        {_id: user._id},
        {$pull: {bookmarks: {post: postId}}}
      );
      if(!userRemoveBookmarkUpdate.nModified){
        return res.status(500).send({ error: ' Could not unbookmark this post. '})
      }
      return res.send({ success: true, operation: 'remove'});
    }
    return res.send({ success: true, operation: 'add'});
  } catch (err) {
    next(err);
  }
};

module.exports.retrieveFollowing = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;
  try {
    const users = await retrieveRelatedUser(user, userId, offset);
    return res.send(users);
  } catch (err) {
    next(err);
  }
};

module.exports.retrieveFollowers = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;

  try {
    const users = await retrieveRelatedUsers(user, userId, offset, true);
    return res.send(users);
  } catch (err) {
    next(err);
  }
};

module.exports.searchUsers = async (req, res, next ) => {
const {username, offset = 0 } = req.params;

if(!username) {
  return res.status(400).send({ error: 'Plese provide a user to search for. '});
}

try {
  const users = await User.aggregate([
    {
      $match: {
        username: {$regex: new RegExp(username), $options: 'i'}
      }
    },
    {
      $lookup: {
        from: 'followers',
        localField: '_id',
        foreignField: 'user',
        as: 'followers'
      },
    },
    {
      $unwind: '$followers'
    },
    {
      $addFields: {
        followersCount: { $size: '$followers.followers'}
      }
    },
    {
      $sort: {followersCount: -1 }
    },
    {
      $skip: Number(offset)
    },
    {
      $limit: 10
    },
    {
      $project: {
        _id: true,
        username: true,
        avatar: true,
        fullName: true
      }
    }
  ]);
  if(users.length === 0) {
    return res.status(404).send({ error: 'Could not find any users matching the criteria.' });
  }
  return res.send(users);
} catch (err) {
  next(err);
  }
}

module.exports.confirmUser = async (req, res, next) => {
    const { token } = req.body;
    const user = res.locals.user;

    console.log(token);

    try {
      const confirmationToken = await ConfirmationToken.findOne({
        token,
        user: user._id
    });
    res.send(confirmationToken);
    } catch (err) {
      next(err);
    }
};

module.exports.updateProfile = async (req, res, next ) => {
  const user = res.locals.user;
  const { fullName, username, website, bio, email} = req.body;
  let confirmationToken = undefined;
  let updateField = {};
  try {
    const userDocument = await User.findOne({ _id: user._id });

    if(fullName){
      const fullNameError= validateFullName(fullName);
      if(fullNameError) return res.status(404).send({ error: fullNameError});
      userDocument.fullName = fullName;
      updateFields.fullName = fullName;
    }

    if(username) {
      const usernameError = validateUsername(username);

    }

  } catch (err) {
    next(err);
  }

}