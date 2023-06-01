const cloudinary = require("cloudinary").v2;

const deleteImagesFromCloudinary = async imageUrls => {
  const regex = /\/v\d+\/(.+)\.\w{3,4}$/;
  const deletePromises = imageUrls.map(imageUrl => {
    if (imageUrl.includes("cloudinary")) {
      const publicIdMatch = imageUrl.match(regex);
      const publicId = publicIdMatch ? publicIdMatch[1] : null;
      if (publicId) {
        return cloudinary.uploader.destroy(publicId);
      }
    }
    // If imageUrl doesn't include "cloudinary", return a resolved Promise
    return Promise.resolve();
  });

  await Promise.all(deletePromises);
};

module.exports = deleteImagesFromCloudinary;
