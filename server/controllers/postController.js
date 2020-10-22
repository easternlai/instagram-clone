const cloudinary = require('cloudinary').v2;
const linkify = require('linkifyjs');
require('linkifyjs/plugins/hashtag')(linkify);
const Post = require('../models/Post');
const PostVote = require('../models/PostVote');
const Following = require('../models/Following');
const Followers = require('../models/Followers');
// const socketHandler= require('../handlers/socketHandler');
const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;

const {
    formatCloudinaryUrl,
    populatePostsPipeline
} = require('../utils/controllerUtils');

const filters = require('../utils/filters');

module.exports.createPost = async (req, res, next) => {
    
    const user = res.locals.user;
    const { caption, filter: filterName } = req.body;
    let post = undefined;
    const filterObject = filters.find((filter) => filter.name === filterName);
    const hashtags = [];

    linkify.find(caption).forEach((result)=> {
        if(result.type === 'hashtag'){
            //pulls just the keyword not the #
            hashtags.push(result.value.substring(1));
        }
    });
    

    if(!req.file) {
        return res 
            .status(400)
            .send( { error: 'Please provide the image to the upload '});
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        const response = await cloudinary.uploader.upload(req.file.path);
        const thumbnailUrl = formatCloudinaryUrl(
            response.secure_url,
            {
                width: 400,
                height: 400
            },
            true
        );
        fs.unlinkSync(req.file.path);
        post = new Post({
            image: response.secure_url,
            thumbnail: thumbnailUrl,
            filter: filterObject ? filterObject.filter : ' ',
            caption,
            author: user._id,
            hashtags
        });

        const postVote = new PostVote({
            post: post._id
        });
        await post.save();
        await postVote.save();
    
        res.status(201).send({
            ...post.toObject(),
            postVote: [],
            comments: [],
            author: { avatar: user.avatar, username: user.username}
        });
    } catch (err) {
        next(err)
    }

    try {
        const followersDocument = await Followers.find({user: user._id });
        const followers = followersDcoument[0].followers;

        //*****Create socket update for each follower.

    } catch (err) {
        next(err);
    }

}

module.exports.deletePost = async (req, res, next ) => {
    const { postId } = req.params;
    const user = res.locals.user;

    console.log(postId);

    try {
        const post = await Post.findOne({ _id: postId, author: user._id });
        if(!post) {
            return res.status(404).send({ error: 'Could not find a post with that id associated with the user.  '})
        }
        const postDelete = await Post.deleteOne({ 
            _id: postId
        });
        if(!postDelete.deletedCount) {
            return res.status(500).send({ error: 'Could not delete the post. '});
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }

    //NOTIFICATION CODE ****

}

module.exports.retrievePost = async (req, res, next) => {


    const { postId } = req.params;

    try {
        //Retrieve the post and the post's votes
        const post = await Post.aggregate([
            { $match: { _id: ObjectId(postId) } },
            {
                $lookup: {
                    from: 'postvotes',
                    localField: '_id',
                    foreignField: 'post',
                    as: 'postVotes'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author'},
            { $unwind: '$postVotes'},
            {
                $unset: [
                    'author.password',
                    'author.email',
                    'author.private',
                    'author.bio',
                    'author.githubId'
                ],
            },
            {
                $addFields: { postVotes: '$postVotes.votes'}
            },
        ]);

        console.log(post);
        if (post.length === 0){
            return res
                .status(404)
                .send({ error: 'Could not find a post with that id.'});
        }

        //*****add comments */
        return res.send({ ...post[0] }) //***ADD COMMENT */
    } catch (err) {
        next(err);
    }
}

module.exports.votePost = async( req, res, next) => {
    const { postId } = req.params;
    const user = res.locals.user;

    try {
        const postLikeUpdate = await PostVote.updateOne(
            { post: postId, 'votes.author': {$ne: user._id}},
            {
                $push: {votes: {author: user._id }}
            }
        );

        if(!postLikeUpdate.nModified){
            if(!postLikeUpdate.ok){
                return res.status(500).send({ error: 'Could not vote on the post. '});
            }
            
            const postDislikeUpdate = await PostVote.update(
                { post: postId },
                {$pull: {votes: {author: user._id }}}
            )

            if(!postDislikeUpdate.nModify){
                if(!postDislikeUpdate.ok){
                    return res.status(500).send({error: 'Coult not vote on the post. '});
                }
            }
        } else {
            //**** SEND NOTIFICATION CODE
        }
        return res.send({ success: true });
    } catch (err) {
        next(err);
    }
}

module.exports.retrievePostFeed = async (req, res, next ) => {
    const user = res.locals.user;
    const { offset } = req.params;

    try {
        const followingDocument = await Following.findOne({ user: user._id });
        if (!followingDocument) {
            return res.status(404).send({ error: 'Could not find any posts. '});
        }
        const following = followingDocument.following.map(
            following => following.user
        );

        console.log(following);

        

        //Fields to not include on the user object
        const unwantedUserFields = [
            'author.password',
            'author.private',
            'author.confirmed',
            'author.bookmarks',
            'author.email',
            'author.website',
            'author.bio',
            'author.githubId'
        ];

        const posts = await Post.aggregate([
            {
                $match: {
                  $or: [{ author: { $in: following } }, { author: ObjectId(user._id) }],
                },
              },
              { $sort: { date: -1 } },
              { $skip: Number(offset) },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'author',
                  foreignField: '_id',
                  as: 'author',
                },
              },
              {
                $lookup: {
                  from: 'postvotes',
                  localField: '_id',
                  foreignField: 'post',
                  as: 'postVotes',
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  let: { postId: '$_id' },
                  pipeline: [
                    {
                      // Finding comments related to the postId
                      $match: {
                        $expr: {
                          $eq: ['$post', '$$postId'],
                        },
                      },
                    },
                    { $sort: { date: -1 } },
                    { $limit: 3 },
                    // Populating the author field
                    {
                      $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'author',
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
                    {
                      $unwind: '$author',
                    },
                    {
                      $unwind: {
                        path: '$commentVotes',
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $unset: unwantedUserFields,
                    },
                    {
                      $addFields: {
                        commentVotes: '$commentVotes.votes',
                      },
                    },
                  ],
                  as: 'comments',
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  let: { postId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$post', '$$postId'],
                        },
                      },
                    },
                    {
                      $group: { _id: null, count: { $sum: 1 } },
                    },
                    {
                      $project: {
                        _id: false,
                      },
                    },
                  ],
                  as: 'commentCount',
                },
              },
              {
                $unwind: {
                  path: '$commentCount',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $unwind: '$postVotes',
              },
              {
                $unwind: '$author',
              },
              {
                $addFields: {
                  postVotes: '$postVotes.votes',
                  commentData: {
                    comments: '$comments',
                    commentCount: '$commentCount.count',
                  },
                },
              },
              {
                $unset: [...unwantedUserFields, 'comments', 'commentCount'],
              },
        ]);
        return res.send(posts);
    } catch (err) {
        next(err);
    }
}

module.exports.retrieveSuggestedPosts = async (req, res, next ) => {
    const { offset = 0 } = req.params;
    console.log('test');
    try {
        const posts = await Post.aggregate([
            {
                $sort: { date: -1 }
            },
            {
                $skip: Number(offset)
            },
            {
                $limit: 20
            },
            {
                $sample: { size: 20 }
            },
            ...populatePostsPipeline
        ]);

        
        return res.send(posts);
    } catch (err) {
        next(err);
    }
}