const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a PDF Buffer to Cloudinary
 * @param {Buffer} buffer - PDF or Image Buffer
 * @param {String} filename - Name of file without extension
 * @param {String} folder - Folder name in Cloudinary (e.g. 'sdf_certificates', 'sdf_invoices')
 * @returns {Promise<String>} - Secure URL of uploaded file
 */
const uploadBufferToCloudinary = (buffer, filename, folder = 'sdf_lms') => {
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: 'raw',
          format: 'pdf',
          overwrite: true
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return resolve(null); // resolve null so main flow continues smoothly
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    } catch (err) {
      console.error('Cloudinary stream error:', err);
      resolve(null);
    }
  });
};

module.exports = {
  uploadBufferToCloudinary
};
