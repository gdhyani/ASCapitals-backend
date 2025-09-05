import { uploadToS3, deleteFromS3, checkFileExists } from "../config/aws";
import { logger } from "../config/logger";
import { IFileUpload, IS3UploadResult } from "../types";

export class FileService {
	// Upload single file to S3
	static async uploadFile(
		file: IFileUpload,
		folder: string = "uploads"
	): Promise<IS3UploadResult> {
		try {
			const fileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
			const fileUrl = await uploadToS3(
				file.buffer,
				fileName,
				file.mimetype,
				folder
			);

			logger.info(`File uploaded successfully: ${fileName}`);

			return {
				Location: fileUrl,
				Key: `${folder}/${Date.now()}-${fileName}`,
				Bucket: process.env.AWS_S3_BUCKET_NAME || "as-capitals-bucket",
			};
		} catch (error) {
			logger.error("File upload error:", error);
			throw new Error("Failed to upload file");
		}
	}

	// Upload multiple files to S3
	static async uploadMultipleFiles(
		files: IFileUpload[],
		folder: string = "uploads"
	): Promise<IS3UploadResult[]> {
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

	// Delete file from S3
	static async deleteFile(fileUrl: string): Promise<void> {
		try {
			await deleteFromS3(fileUrl);
			logger.info(`File deleted successfully: ${fileUrl}`);
		} catch (error) {
			logger.error("File deletion error:", error);
			throw new Error("Failed to delete file");
		}
	}

	// Delete multiple files from S3
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

	// Check if file exists in S3
	static async fileExists(fileUrl: string): Promise<boolean> {
		try {
			return await checkFileExists(fileUrl);
		} catch (error) {
			logger.error("File existence check error:", error);
			return false;
		}
	}

	// Upload property images
	static async uploadPropertyImages(files: IFileUpload[]): Promise<string[]> {
		try {
			const results = await this.uploadMultipleFiles(files, "properties");
			return results.map((result) => result.Location);
		} catch (error) {
			logger.error("Property images upload error:", error);
			throw new Error("Failed to upload property images");
		}
	}

	// Upload user profile image
	static async uploadProfileImage(file: IFileUpload): Promise<string> {
		try {
			const result = await this.uploadFile(file, "profiles");
			return result.Location;
		} catch (error) {
			logger.error("Profile image upload error:", error);
			throw new Error("Failed to upload profile image");
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
