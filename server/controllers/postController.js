const cloudinary = require('cloudinary').v2;
const linkify = require('linkifyjs');
require('linkifyjs/plugins/hashtag')(linkify);
// const Post = require('../models/Post');
// const PostVote = require('../models/PostVote');
// const Followers = require('../models/Followers');
// const socketHandler= require('../handlers/socketHandler');
const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;

const {
    formatCloudinaryUrl
} = require('../utils/controllerUtils');

module.exports.createPost = async (req, res, next) => {
    const user = req.locals.user;
    const { caption, filter: filterName } = req.body;
    let post = undefined;
    const filterObject = filters.find((filter) => filter.name === filterName);
    const hastags = [];
    linkify.find(caption).foreach((result)=> {
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



    
}