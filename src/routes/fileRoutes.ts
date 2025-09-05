import { Router } from "express";
import { FileService } from "../services/fileService";
import { authenticate } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadSingle, uploadMultiple } from "../middleware/upload";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

const router = Router();

// Upload single file
router.post(
	"/upload",
	authenticate,
	uploadLimiter,
	uploadSingle("file"),
	async (req, res) => {
		try {
			if (!req.file) {
				const response: IApiResponse = {
					success: false,
					message: "No file provided",
				};
				res.status(400).json(response);
				return;
			}

			const result = await FileService.uploadFile(req.file);

			const response: IApiResponse = {
				success: true,
				message: "File uploaded successfully",
				data: { file: result },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("File upload error:", error);

			const response: IApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "File upload failed",
			};

			res.status(400).json(response);
		}
	}
);

// Upload multiple files
router.post(
	"/upload-multiple",
	authenticate,
	uploadLimiter,
	uploadMultiple("files", 10),
	async (req, res) => {
		try {
			const files = req.files as Express.Multer.File[];

			if (!files || files.length === 0) {
				const response: IApiResponse = {
					success: false,
					message: "No files provided",
				};
				res.status(400).json(response);
				return;
			}

			const results = await FileService.uploadMultipleFiles(files);

			const response: IApiResponse = {
				success: true,
				message: "Files uploaded successfully",
				data: { files: results },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Multiple files upload error:", error);

			const response: IApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "Files upload failed",
			};

			res.status(400).json(response);
		}
	}
);

// Upload profile image
router.post(
	"/upload-profile",
	authenticate,
	uploadLimiter,
	uploadSingle("image"),
	async (req, res) => {
		try {
			if (!req.file) {
				const response: IApiResponse = {
					success: false,
					message: "No image provided",
				};
				res.status(400).json(response);
				return;
			}

			const imageUrl = await FileService.uploadProfileImage(req.file);

			const response: IApiResponse = {
				success: true,
				message: "Profile image uploaded successfully",
				data: { imageUrl },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Profile image upload error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Profile image upload failed",
			};

			res.status(400).json(response);
		}
	}
);

// Delete file
router.delete("/delete", authenticate, async (req, res) => {
	try {
		const { fileUrl } = req.body;

		if (!fileUrl) {
			const response: IApiResponse = {
				success: false,
				message: "File URL is required",
			};
			res.status(400).json(response);
			return;
		}

		await FileService.deleteFile(fileUrl);

		const response: IApiResponse = {
			success: true,
			message: "File deleted successfully",
		};

		res.status(200).json(response);
	} catch (error) {
		logger.error("File deletion error:", error);

		const response: IApiResponse = {
			success: false,
			message: error instanceof Error ? error.message : "File deletion failed",
		};

		res.status(400).json(response);
	}
});

// Check if file exists
router.get("/exists", authenticate, async (req, res) => {
	try {
		const { fileUrl } = req.query;

		if (!fileUrl) {
			const response: IApiResponse = {
				success: false,
				message: "File URL is required",
			};
			res.status(400).json(response);
			return;
		}

		const exists = await FileService.fileExists(fileUrl as string);

		const response: IApiResponse = {
			success: true,
			message: "File existence checked",
			data: { exists },
		};

		res.status(200).json(response);
	} catch (error) {
		logger.error("File existence check error:", error);

		const response: IApiResponse = {
			success: false,
			message: "File existence check failed",
		};

		res.status(500).json(response);
	}
});

export default router;
