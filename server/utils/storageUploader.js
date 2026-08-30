const fs = require('fs');
const path = require('path');

/**
 * Upload and persist a PDF Buffer directly to the Server / AWS storage directory
 * @param {Buffer} buffer - PDF or Binary Buffer
 * @param {String} filename - Name of file without extension
 * @param {String} folder - Subdirectory name (e.g. 'sdf_certificates', 'sdf_invoices', 'certificates', 'invoices')
 * @returns {Promise<String>} - Public relative URL of the saved file
 */
const uploadBufferToStorage = async (buffer, filename, folder = 'uploads') => {
  return new Promise((resolve) => {
    try {
      // Normalize folder name (e.g., 'sdf_certificates' -> 'certificates', 'sdf_invoices' -> 'invoices')
      let subfolder = folder.replace('sdf_', '');
      if (subfolder === 'lms') subfolder = 'courses';

      const targetDir = path.join(__dirname, '..', 'uploads', subfolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const safeFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const filePath = path.join(targetDir, safeFilename);

      fs.writeFileSync(filePath, buffer);

      // Return public URL path served statically by Express
      const publicUrl = `/uploads/${subfolder}/${safeFilename}`;
      resolve(publicUrl);
    } catch (err) {
      console.error('Server storage upload error:', err);
      resolve(null);
    }
  });
};

module.exports = {
  uploadBufferToStorage,
  uploadBufferToCloudinary: uploadBufferToStorage // Backward compatibility alias
};
