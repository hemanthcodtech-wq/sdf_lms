const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sdf_lms',
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'pdf'],
    resource_type: 'auto' // Automatically determine if image, video, or raw
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
