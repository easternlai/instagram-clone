module.exports.formatCloudinaryUrl = (url, size, thumb) => {
    const splitUrl = url.split('upload/');
    splitUrl[0] += `upload/${
        size.y && size.z ? `x_${size.x},y_${size.y},` : ''
      }w_${size.width},h_${size.height}${thumb && ',c_thumb'}/`;
      const formattedUrl = splitUrl[0] + splitUrl[1];
      return formattedUrl;
};

module.exports.populatePostsPipeline = [
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
    $lookup: {
      from: 'postvotes',
      localField: '_id',
      foreignField: 'post',
      as: 'postVotes',
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
      comments: { $size: '$comments' },
      commentReplies: { $size: '$commentReplies' },
      postVotes: { $size: '$postVotes.votes' },
    },
  },
  {
    $addFields: { comments: { $add: ['$comments', '$commentReplies'] } },
  },
  {
    $unset: [
      'commentReplies',
      'author.private',
      'author.confirmed',
      'author.githubId',
      'author.bookmarks',
      'author.password',
    ],
  },
];
