import multer from "multer";
import { Request } from "express";
import { UPLOAD_CONFIG } from "../config/aws";
import { logger } from "../config/logger";

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
) => {
	// Check file type
	if (UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				`File type ${
					file.mimetype
				} is not allowed. Allowed types: ${UPLOAD_CONFIG.allowedMimeTypes.join(
					", "
				)}`
			)
		);
	}
};

// Configure multer
const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: UPLOAD_CONFIG.maxFileSize,
		files: 10, // Maximum 10 files per request
	},
});

// Single file upload middleware
export const uploadSingle = (fieldName: string = "file") => {
	return (req: Request, res: any, next: any) => {
		upload.single(fieldName)(req, res, (err) => {
			if (err) {
				logger.error("File upload error:", err);

				if (err instanceof multer.MulterError) {
					if (err.code === "LIMIT_FILE_SIZE") {
						return res.status(400).json({
							success: false,
							message: `File size too large. Maximum size allowed: ${
								UPLOAD_CONFIG.maxFileSize / 1024 / 1024
							}MB`,
						});
					}
					if (err.code === "LIMIT_FILE_COUNT") {
						return res.status(400).json({
							success: false,
							message: "Too many files. Maximum 10 files allowed per request.",
						});
					}
				}

				return res.status(400).json({
					success: false,
					message: err.message || "File upload failed",
				});
			}

			next();
		});
	};
};

// Multiple files upload middleware
export const uploadMultiple = (
	fieldName: string = "files",
	maxCount: number = 10
) => {
	return (req: Request, res: any, next: any) => {
		upload.array(fieldName, maxCount)(req, res, (err) => {
			if (err) {
				logger.error("Multiple files upload error:", err);

				if (err instanceof multer.MulterError) {
					if (err.code === "LIMIT_FILE_SIZE") {
						return res.status(400).json({
							success: false,
							message: `File size too large. Maximum size allowed: ${
								UPLOAD_CONFIG.maxFileSize / 1024 / 1024
							}MB`,
						});
					}
					if (err.code === "LIMIT_FILE_COUNT") {
						return res.status(400).json({
							success: false,
							message: `Too many files. Maximum ${maxCount} files allowed per request.`,
						});
					}
				}

				return res.status(400).json({
					success: false,
					message: err.message || "File upload failed",
				});
			}

			next();
		});
	};
};

// Fields upload middleware (for different file types)
export const uploadFields = (fields: multer.Field[]) => {
	return (req: Request, res: any, next: any) => {
		upload.fields(fields)(req, res, (err) => {
			if (err) {
				logger.error("Fields upload error:", err);

				if (err instanceof multer.MulterError) {
					if (err.code === "LIMIT_FILE_SIZE") {
						return res.status(400).json({
							success: false,
							message: `File size too large. Maximum size allowed: ${
								UPLOAD_CONFIG.maxFileSize / 1024 / 1024
							}MB`,
						});
					}
					if (err.code === "LIMIT_FILE_COUNT") {
						return res.status(400).json({
							success: false,
							message:
								"Too many files. Maximum files allowed per request exceeded.",
						});
					}
				}

				return res.status(400).json({
					success: false,
					message: err.message || "File upload failed",
				});
			}

			next();
		});
	};
};
