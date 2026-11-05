const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { ApiError } = require('../utils/apiResponse');

// Destination folder for uploaded product images
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'products');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed image formats
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    const uniqueHash = crypto.randomBytes(8).toString('hex');
    const safeName = `prod_${Date.now()}_${uniqueHash}${cleanExt}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Reject invalid extensions or MIME types
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(
      new ApiError(
        'Only JPG, JPEG, PNG and WEBP images are allowed.',
        400,
        'INVALID_IMAGE_FORMAT'
      ),
      false
    );
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per image
    files: 8, // Maximum 8 images per product
  },
});

/**
 * Validates magic number signatures of uploaded files to prevent disguised payloads.
 */
function validateFileSignatures(files = []) {
  for (const file of files) {
    if (!file.path || !fs.existsSync(file.path)) continue;

    try {
      const buffer = Buffer.alloc(12);
      const fd = fs.openSync(file.path, 'r');
      fs.readSync(fd, buffer, 0, 12, 0);
      fs.closeSync(fd);

      const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

      if (!isJpeg && !isPng && !isWebp) {
        // Delete invalid file immediately
        try { fs.unlinkSync(file.path); } catch {}
        throw new ApiError(
          'Image file content is invalid or corrupted. Only genuine JPG, PNG, and WEBP images are allowed.',
          400,
          'INVALID_IMAGE_SIGNATURE'
        );
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // If error reading, clean up
      try { fs.unlinkSync(file.path); } catch {}
      throw new ApiError('Unable to read this image file.', 400, 'UNABLE_TO_READ_IMAGE');
    }
  }
}

/**
 * Middleware wrapper to handle multer error responses and validate signatures.
 */
function handleProductImageUpload(fieldName = 'images', maxCount = 8) {
  const multerMiddleware = upload.array(fieldName, maxCount);

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError('Image size must be 10 MB or smaller.', 400, 'IMAGE_TOO_LARGE'));
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError('You can upload a maximum of 8 images.', 400, 'TOO_MANY_IMAGES'));
        }
        return next(new ApiError(`Upload error: ${err.message}`, 400, 'UPLOAD_ERROR'));
      }
      if (err) {
        return next(err);
      }

      // Check file signatures
      if (req.files && req.files.length > 0) {
        try {
          validateFileSignatures(req.files);
        } catch (sigErr) {
          return next(sigErr);
        }
      }

      next();
    });
  };
}

module.exports = {
  upload,
  handleProductImageUpload,
  validateFileSignatures,
  UPLOAD_DIR,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
