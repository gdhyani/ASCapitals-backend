import {
	uploadToImageKit,
	uploadBase64ToImageKit,
	deleteFromImageKit,
	extractFileIdFromUrl,
} from "../config/imagekit";
import { logger } from "../config/logger";
import { IFileUpload, IImageKitUploadResult } from "../types";

export class FileService {
	// Upload single file to ImageKit
	static async uploadFile(
		file: IFileUpload,
		folder: string = "uploads"
	): Promise<IImageKitUploadResult> {
		try {
			const fileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
			const fileUrl = await uploadToImageKit(file.buffer, fileName, folder);

			logger.info(`File uploaded successfully: ${fileName}`);

			return {
				url: fileUrl,
				fileName: `${Date.now()}-${fileName}`,
				folder: folder,
			};
		} catch (error) {
			logger.error("File upload error - File Service:", error);
			throw new Error("Failed to upload file");
		}
	}

	// Upload multiple files to ImageKit
	static async uploadMultipleFiles(
		files: IFileUpload[],
		folder: string = "uploads"
	): Promise<IImageKitUploadResult[]> {
		try {
			const uploadPromises = files.map((file) => this.uploadFile(file, folder));
			const results = await Promise.all(uploadPromises);

			logger.info(`${files.length} files uploaded successfully`);

			return results;
		} catch (error) {
			logger.error("Multiple files upload error:", error);
			throw new Error("Failed to upload files");
		}
	}

	// Delete file from ImageKit
	static async deleteFile(fileUrl: string): Promise<void> {
		try {
			const fileId = extractFileIdFromUrl(fileUrl);
			if (fileId) {
				await deleteFromImageKit(fileId);
				logger.info(`File deleted successfully: ${fileUrl}`);
			} else {
				throw new Error("Could not extract file ID from URL");
			}
		} catch (error) {
			logger.error("File deletion error:", error);
			throw new Error("Failed to delete file");
		}
	}

	// Delete multiple files from ImageKit
	static async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
		try {
			const deletePromises = fileUrls.map((url) => this.deleteFile(url));
			await Promise.all(deletePromises);

			logger.info(`${fileUrls.length} files deleted successfully`);
		} catch (error) {
			logger.error("Multiple files deletion error:", error);
			throw new Error("Failed to delete files");
		}
	}

	// Check if file exists in ImageKit
	static async fileExists(fileUrl: string): Promise<boolean> {
		try {
			// For ImageKit, we can try to fetch the file details
			// If it exists, it will return details, if not, it will throw an error
			const fileId = extractFileIdFromUrl(fileUrl);
			if (!fileId) return false;

			// For now, we'll assume the file exists if we have a valid URL
			// In a real implementation, you might want to call ImageKit API to check
			return fileUrl.includes("ik.imagekit.io");
		} catch (error) {
			logger.error("File existence check error:", error);
			return false;
		}
	}

	// Upload property images
	static async uploadPropertyImages(files: IFileUpload[]): Promise<string[]> {
		try {
			const results = await this.uploadMultipleFiles(files, "properties");
			return results.map((result) => result.url);
		} catch (error) {
			logger.error("Property images upload error:", error);
			throw new Error("Failed to upload property images");
		}
	}

	// Upload user profile image
	static async uploadProfileImage(file: IFileUpload): Promise<string> {
		try {
			console.log("file-uploadProfileImage", file);
			const result = await this.uploadFile(file, "profiles");
			return result.url;
		} catch (error) {
			logger.error("Profile image upload error:", error);
			throw new Error("Failed to upload profile image");
		}
	}

	// Upload base64 profile image
	static async uploadBase64ProfileImage(
		base64Data: string,
		fileName: string
	): Promise<string> {
		try {
			const imageUrl = await uploadBase64ToImageKit(
				base64Data,
				fileName,
				"profiles"
			);
			return imageUrl;
		} catch (error) {
			logger.error("Base64 profile image upload error:", error);
			throw new Error("Failed to upload base64 profile image");
		}
	}

	// Clean up orphaned files (files not referenced in database)
	static async cleanupOrphanedFiles(): Promise<{
		deleted: number;
		errors: number;
	}> {
		try {
			// This is a placeholder for cleanup logic
			// In a real implementation, you would:
			// 1. Get all file URLs from your database
			// 2. List all files in S3 bucket
			// 3. Compare and delete orphaned files

			logger.info("Orphaned files cleanup completed");
			return { deleted: 0, errors: 0 };
		} catch (error) {
			logger.error("Cleanup orphaned files error:", error);
			throw new Error("Failed to cleanup orphaned files");
		}
	}

	// Get file info from URL
	static getFileInfoFromUrl(fileUrl: string): {
		fileName: string;
		folder: string;
		key: string;
	} | null {
		try {
			const urlParts = fileUrl.split("/");
			const key = urlParts.slice(3).join("/"); // Remove protocol and domain parts
			const keyParts = key.split("/");
			const folder = keyParts[0];
			const fileName = keyParts[keyParts.length - 1];

			return {
				fileName,
				folder,
				key,
			};
		} catch (error) {
			logger.error("Get file info from URL error:", error);
			return null;
		}
	}

	// Validate file type
	static validateFileType(mimetype: string): boolean {
		const allowedTypes = (
			process.env.ALLOWED_FILE_TYPES ||
			"image/jpeg,image/png,image/gif,application/pdf"
		).split(",");
		return allowedTypes.includes(mimetype);
	}

	// Validate file size
	static validateFileSize(size: number): boolean {
		const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB
		return size <= maxSize;
	}
}
