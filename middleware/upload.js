const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on file type
    let subfolder = 'general';
    if (file.fieldname === 'assignment_file') subfolder = 'assignments';
    if (file.fieldname === 'submission_file') subfolder = 'submissions';
    if (file.fieldname === 'profile_picture') subfolder = 'profiles';
    
    const targetDir = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'assignment_file': ['.pdf', '.doc', '.docx', '.txt', '.zip'],
    'submission_file': ['.pdf', '.doc', '.docx', '.txt', '.zip', '.jpg', '.png'],
    'profile_picture': ['.jpg', '.jpeg', '.png', '.gif']
  };

  const extension = path.extname(file.originalname).toLowerCase();
  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes['assignment_file'];

  if (fieldAllowedTypes.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types for ${file.fieldname}: ${fieldAllowedTypes.join(', ')}`), false);
  }
};

// Configure upload limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  
  next(err);
};

module.exports = {
  upload,
  handleUploadError
};
