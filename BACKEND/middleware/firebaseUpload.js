const sharp = require('sharp');

/**
 * Photo Storage Middleware (Base64 + Compression)
 * 
 * Since Firebase Storage required billing, we now store photos directly in MongoDB.
 * We use 'sharp' to compress and resize images to ensure they stay under 1MB,
 * preventing database bloat and staying well within MongoDB's 16MB document limit.
 */

const uploadToFirebase = async (file, folder = 'uploads') => {
  if (!file) return null;

  try {
    // Compress and resize image before conversion
    const compressedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }) // Limit size
      .jpeg({ quality: 70 }) // Good quality but small size
      .toBuffer();

    // Convert buffer to Base64 data URI
    const base64 = compressedBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;
    
    console.log(`✅ Photo compressed & stored as Base64 [${folder}] - Original: ${Math.round(file.size / 1024)}KB, New: ${Math.round(compressedBuffer.length / 1024)}KB`);
    return dataUri;
  } catch (err) {
    console.error('❌ Photo processing/compression error:', err.message);
    // Fallback to original buffer if sharp fails
    try {
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    } catch (fallbackErr) {
      return null;
    }
  }
};

module.exports = { uploadToFirebase };
