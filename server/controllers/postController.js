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
    formatCloudinaryUrl
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
        console.log(followersDocument);
    } catch (err) {
        next(err)
    }


}