import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "./logger";

// Configure AWS SDK v3
const s3Client = new S3Client({
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

export { s3Client };

// S3 bucket configuration
export const S3_BUCKET_NAME =
	process.env.AWS_S3_BUCKET_NAME || "as-capitals-bucket";

// File upload configuration
export const UPLOAD_CONFIG = {
	maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB
	allowedMimeTypes: (
		process.env.ALLOWED_FILE_TYPES ||
		"image/jpeg,image/png,image/gif,application/pdf"
	).split(","),
};

// Upload file to S3
export const uploadToS3 = async (
	file: Buffer,
	fileName: string,
	mimeType: string,
	folder: string = "uploads"
): Promise<string> => {
	try {
		const key = `${folder}/${Date.now()}-${fileName}`;

		const command = new PutObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: key,
			Body: file,
			ContentType: mimeType,
			ACL: "public-read", // Make file publicly accessible
		});

		await s3Client.send(command);

		// Construct the URL manually since SDK v3 doesn't return Location
		const fileUrl = `https://${S3_BUCKET_NAME}.s3.${
			process.env.AWS_REGION || "us-east-1"
		}.amazonaws.com/${key}`;
		logger.info(`File uploaded to S3: ${fileUrl}`);

		return fileUrl;
	} catch (error) {
		logger.error("S3 upload error:", error);
		throw new Error("Failed to upload file to S3");
	}
};

// Delete file from S3
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
	try {
		// Extract key from URL
		const urlParts = fileUrl.split("/");
		const key = urlParts.slice(3).join("/"); // Remove protocol and domain parts

		const command = new DeleteObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: key,
		});

		await s3Client.send(command);
		logger.info(`File deleted from S3: ${fileUrl}`);
	} catch (error) {
		logger.error("S3 delete error:", error);
		throw new Error("Failed to delete file from S3");
	}
};

// Check if file exists in S3
export const checkFileExists = async (fileUrl: string): Promise<boolean> => {
	try {
		const urlParts = fileUrl.split("/");
		const key = urlParts.slice(3).join("/");

		const command = new HeadObjectCommand({
			Bucket: S3_BUCKET_NAME,
			Key: key,
		});

		await s3Client.send(command);
		return true;
	} catch (error) {
		return false;
	}
};
