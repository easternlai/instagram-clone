const Comment = require("../models/Comment");
const { response } = require("express");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports.retrieveComments = async (postId, offset, exclude = 0) => {
  try {
    const commentsAggregation = await Comment.aggregate([
      {
        $facet: {
          comments: [
            { $match: { post: ObjectId(postId) } },
            // Sort the newest comments to the top
            { $sort: { date: -1 } },
            // Skip the comments we do not want
            // This is desireable in the even that a comment has been created
            // and stored locally, we'd not want duplicate comments
            { $skip: Number(exclude) },
            // Re-sort the comments to an ascending order
            { $sort: { date: 1 } },
            { $skip: Number(offset) },
            { $limit: 10 },
            {
              $lookup: {
                from: 'commentreplies',
                localField: '_id',
                foreignField: 'parentComment',
                as: 'commentReplies',
              },
            },
            {
              $lookup: {
                from: 'commentvotes',
                localField: '_id',
                foreignField: 'comment',
                as: 'commentVotes',
              },
            },
            { $unwind: '$commentVotes' },
            {
              $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'author',
              },
            },
            { $unwind: '$author' },
            {
              $addFields: {
                commentReplies: { $size: '$commentReplies' },
                commentVotes: '$commentVotes.votes',
              },
            },
            {
              $unset: [
                'author.password',
                'author.email',
                'author.private',
                'author.bio',
                'author.bookmarks',
              ],
            },
          ],
          commentCount: [
            {
              $match: { post: ObjectId(postId) },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
        },
      },
      {
        $unwind: '$commentCount',
      },
      {
        $addFields: {
          commentCount: '$commentCount.count',
        },
      },
    ]);
    return commentsAggregation[0];
  } catch (err) {
    throw new Error(err);
  }
};

module.exports.formatCloudinaryUrl = (url, size, thumb) => {
  const splitUrl = url.split("upload/");
  splitUrl[0] += `upload/${
    size.y && size.z ? `x_${size.x},y_${size.y},` : ""
  }w_${size.width},h_${size.height}${thumb && ",c_thumb"}/`;
  const formattedUrl = splitUrl[0] + splitUrl[1];
  return formattedUrl;
};

module.exports.populatePostsPipeline = [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
    },
  },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "post",
      as: "comments",
    },
  },
  {
    $lookup: {
      from: "commentreplies",
      localField: "comments._id",
      foreignField: "parentComment",
      as: "commentReplies",
    },
  },
  {
    $lookup: {
      from: "postvotes",
      localField: "_id",
      foreignField: "post",
      as: "postVotes",
    },
  },
  {
    $unwind: "$postVotes",
  },
  {
    $unwind: "$author",
  },
  {
    $addFields: {
      comments: { $size: "$comments" },
      commentReplies: { $size: "$commentReplies" },
      postVotes: { $size: "$postVotes.votes" },
    },
  },
  {
    $addFields: { comments: { $add: ["$comments", "$commentReplies"] } },
  },
  {
    $unset: [
      "commentReplies",
      "author.private",
      "author.confirmed",
      "author.githubId",
      "author.bookmarks",
      "author.password",
    ],
  },
];


module.exports.populatePostsPipeline = [
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'author'
    }
  },
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
      from: 'commentreplies',
      localField: 'comments._id',
      foreignField: 'parentComment',
      as: 'commentReplies'
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
  {
    $unwind: '$postVotes'
  },
  {
    $unwind: '$author'
  },
  {
    $addFields: {
      comments: {$size: '$comments' },
      commentReplies: { $size: '$commentReplies'},
      postVotes: { $size: '$postVotes.votes' }
    }
  },
  {
    $addFields: { comments: { $add: ['$comments', '$commentReplies'] } }
  },
  {
    $unset: [
      'commentReplies',
      'author.private',
      'author.confirmed',
      'author.githubId',
      'author.bookmarks',
      'author.password'
    ]
  }
]