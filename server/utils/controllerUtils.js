module.exports.formatCloudinaryUrl = (url, size, thumb) => {
    const splitUrl = url.split('upload/');
    splitUrl[0] += `upload/${
        size.y && size.z ? `x_${size.x},y_${size.y},` : ''
      }w_${size.width},h_${size.height}${thumb && ',c_thumb'}/`;
      const formattedUrl = splitUrl[0] + splitUrl[1];
      return formattedUrl;
};
