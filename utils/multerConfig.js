import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, PNG allowed"), false); // Reject the file
  }
};

const multipleFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, PNG, MP4 allowed"), false); // Reject the file
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB file size limit
    files: 1, // Only 1 file allowed
  },
  fileFilter: fileFilter,
});

const multipleUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB file size limit
    files: 5, // Only 5 files allowed
  },
  fileFilter: multipleFileFilter,
});

export { upload, multipleUpload };
