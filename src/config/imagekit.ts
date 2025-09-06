import ImageKit from "imagekit";
import { logger } from "./logger";

// Configure ImageKit
const imagekit = new ImageKit({
	publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
	urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export { imagekit };

// File upload configuration
export const UPLOAD_CONFIG = {
	maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB
	allowedMimeTypes: (
		process.env.ALLOWED_FILE_TYPES ||
		"image/jpeg,image/png,image/gif,image/webp"
	).split(","),
};

// Upload file to ImageKit
export const uploadToImageKit = async (
	file: Buffer,
	fileName: string,
	folder: string = "uploads"
): Promise<string> => {
	try {
		console.log("fileName", fileName);
		console.log("file", file);
		console.log("folder", folder);
		const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
		const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

		const response = await imagekit.upload({
			file: file,
			fileName: uniqueFileName,
			folder: folder,
			useUniqueFileName: false, 
			isPublished: true,
		});

		logger.info(`File uploaded to ImageKit: ${response.url}`);
		return response.url;
	} catch (error) {
		logger.error("ImageKit upload error:", error);
		throw new Error("Failed to upload file to ImageKit");
	}
};

// Upload base64 image to ImageKit
export const uploadBase64ToImageKit = async (
	base64Data: string,
	fileName: string,
	folder: string = "uploads"
): Promise<string> => {
	try {
		const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
		const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

		const response = await imagekit.upload({
			file: base64Data,
			fileName: uniqueFileName,
			folder: folder,
			useUniqueFileName: false,
		});

		logger.info(`Base64 file uploaded to ImageKit: ${response.url}`);
		return response.url;
	} catch (error) {
		logger.error("ImageKit base64 upload error:", error);
		throw new Error("Failed to upload base64 file to ImageKit");
	}
};

// Delete file from ImageKit
export const deleteFromImageKit = async (fileId: string): Promise<void> => {
	try {
		await imagekit.deleteFile(fileId);
		logger.info(`File deleted from ImageKit: ${fileId}`);
	} catch (error) {
		logger.error("ImageKit delete error:", error);
		throw new Error("Failed to delete file from ImageKit");
	}
};

// Get file details from ImageKit
export const getImageKitFileDetails = async (fileId: string): Promise<any> => {
	try {
		const fileDetails = await imagekit.getFileDetails(fileId);
		return fileDetails;
	} catch (error) {
		logger.error("ImageKit get file details error:", error);
		throw new Error("Failed to get file details from ImageKit");
	}
};

// Extract file ID from ImageKit URL
export const extractFileIdFromUrl = (url: string): string | null => {
	try {
		// ImageKit URLs typically have the file ID in the path
		// Example: https://ik.imagekit.io/ascapitals/uploads/1234567890-image.jpg
		const urlParts = url.split("/");
		const fileName = urlParts[urlParts.length - 1];
		// The file ID is usually the filename without extension or the actual fileId from ImageKit
		// For now, we'll return the full path after the endpoint
		const pathAfterEndpoint = url.replace(
			process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/ascapitals",
			""
		);
		return pathAfterEndpoint.startsWith("/")
			? pathAfterEndpoint.substring(1)
			: pathAfterEndpoint;
	} catch (error) {
		logger.error("Extract file ID from URL error:", error);
		return null;
	}
};

// Generate transformation URL
export const generateTransformationUrl = (
	url: string,
	transformations: {
		width?: number;
		height?: number;
		quality?: number;
		format?: string;
	}
): string => {
	try {
		const transformationString = Object.entries(transformations)
			.map(([key, value]) => {
				switch (key) {
					case "width":
						return `w-${value}`;
					case "height":
						return `h-${value}`;
					case "quality":
						return `q-${value}`;
					case "format":
						return `f-${value}`;
					default:
						return "";
				}
			})
			.filter(Boolean)
			.join(",");

		if (!transformationString) return url;

		// Insert transformation parameters into ImageKit URL
		const urlParts = url.split("/");
		const endpointIndex = urlParts.findIndex((part) =>
			part.includes("ik.imagekit.io")
		);

		if (endpointIndex !== -1) {
			urlParts.splice(endpointIndex + 2, 0, `tr:${transformationString}`);
			return urlParts.join("/");
		}

		return url;
	} catch (error) {
		logger.error("Generate transformation URL error:", error);
		return url;
	}
};
