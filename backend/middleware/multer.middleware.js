import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { fileURLToPath } from "url";
import { logger } from "../util/logger.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4() + path.extname(file.originalname);
    const filePath = `/public/uploads/${uniqueSuffix}`; // Relative path for static access
    file.filePath = filePath; // Attach file path to the file object
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: fileFilter,
});

export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    singleUpload(req, res, (err) => {
      if (err) {
        return next(err);
      }
      if (req.file) {
        req.filePath = req.file.filePath; // Attach file path to the request object
      }
      next();
    });
  };
};

export const uploadMultiple = (req, res, next) => {
  logger.info(
    "[multer.middleware]-[uploadMultiple]-[Info]: Uploading multiple files" +
      `${req.files}`,
  );

  upload.any()(req, res, (err) => {
    if (err) {
      logger.error(
        "[multer.middleware]-[uploadMultiple]-[Error]: Error uploading files",
        err,
      );
      return res.status(500).json({
        success: false,
        message: "Error uploading files",
        error: err.message,
      });
    }

    if (req.files && req.files.length > 0) {
      logger.info(
        "[multer.middleware]-[uploadMultiple]-[Info]: Files uploaded successfully",
      );
      req.filePaths = req.files.map((file) => file.filePath); // use `file.path` not `file.filePath`
      logger.info(
        "[multer.middleware]-[uploadMultiple]-[Info]: File paths",
        req.filePaths,
      );
    }

    next();
  });
};