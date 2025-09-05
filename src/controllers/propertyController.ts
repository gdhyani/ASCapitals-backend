import { Request, Response } from "express";
import { PropertyService } from "../services/propertyService";
import { FileService } from "../services/fileService";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

export class PropertyController {
	// Create new property
	static async createProperty(req: Request, res: Response): Promise<void> {
		try {
			const ownerId = req.user!._id;
			const propertyData = req.body;

			const property = await PropertyService.createProperty(
				propertyData,
				ownerId
			);

			const response: IApiResponse = {
				success: true,
				message: "Property created successfully",
				data: { property },
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error("Create property error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Property creation failed",
			};

			res.status(400).json(response);
		}
	}

	// Get property by ID
	static async getPropertyById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const property = await PropertyService.getPropertyById(id);

			if (!property) {
				const response: IApiResponse = {
					success: false,
					message: "Property not found",
				};
				res.status(404).json(response);
				return;
			}

			const response: IApiResponse = {
				success: true,
				message: "Property retrieved successfully",
				data: { property },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get property by ID error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve property",
			};

			res.status(500).json(response);
		}
	}

	// Get all properties
	static async getAllProperties(req: Request, res: Response): Promise<void> {
		try {
			const queryParams = {
				page: parseInt(req.query.page as string) || 1,
				limit: parseInt(req.query.limit as string) || 10,
				sort: (req.query.sort as string) || "-createdAt",
				search: req.query.search as string,
				filter: {
					propertyType: req.query.propertyType as string,
					status: req.query.status as string,
					minPrice: req.query.minPrice
						? parseFloat(req.query.minPrice as string)
						: undefined,
					maxPrice: req.query.maxPrice
						? parseFloat(req.query.maxPrice as string)
						: undefined,
					minBedrooms: req.query.minBedrooms
						? parseInt(req.query.minBedrooms as string)
						: undefined,
					minBathrooms: req.query.minBathrooms
						? parseFloat(req.query.minBathrooms as string)
						: undefined,
					city: req.query.city as string,
					state: req.query.state as string,
				},
			};

			const result = await PropertyService.getAllProperties(queryParams);

			const response: IApiResponse = {
				success: true,
				message: "Properties retrieved successfully",
				data: { properties: result.properties },
				pagination: {
					page: queryParams.page,
					limit: queryParams.limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get all properties error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve properties",
			};

			res.status(500).json(response);
		}
	}

	// Update property
	static async updateProperty(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const userId = req.user!._id;
			const userRole = req.user!.role;

			const property = await PropertyService.updateProperty(
				id,
				updateData,
				userId,
				userRole
			);

			const response: IApiResponse = {
				success: true,
				message: "Property updated successfully",
				data: { property },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Update property error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Property update failed",
			};

			res.status(400).json(response);
		}
	}

	// Delete property
	static async deleteProperty(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!._id;
			const userRole = req.user!.role;

			await PropertyService.deleteProperty(id, userId, userRole);

			const response: IApiResponse = {
				success: true,
				message: "Property deleted successfully",
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Delete property error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Property deletion failed",
			};

			res.status(400).json(response);
		}
	}

	// Get properties by owner
	static async getPropertiesByOwner(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { ownerId } = req.params;
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;

			const result = await PropertyService.getPropertiesByOwner(
				ownerId,
				page,
				limit
			);

			const response: IApiResponse = {
				success: true,
				message: "Properties retrieved successfully",
				data: { properties: result.properties },
				pagination: {
					page,
					limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get properties by owner error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve properties",
			};

			res.status(500).json(response);
		}
	}

	// Get properties by agent
	static async getPropertiesByAgent(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { agentId } = req.params;
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;

			const result = await PropertyService.getPropertiesByAgent(
				agentId,
				page,
				limit
			);

			const response: IApiResponse = {
				success: true,
				message: "Properties retrieved successfully",
				data: { properties: result.properties },
				pagination: {
					page,
					limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get properties by agent error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve properties",
			};

			res.status(500).json(response);
		}
	}

	// Upload property images
	static async uploadPropertyImages(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { id } = req.params;
			const files = req.files as Express.Multer.File[];

			if (!files || files.length === 0) {
				const response: IApiResponse = {
					success: false,
					message: "No files provided",
				};
				res.status(400).json(response);
				return;
			}

			const imageUrls = await FileService.uploadPropertyImages(files);

			// Update property with new images
			const userId = req.user!._id;
			const userRole = req.user!.role;
			const property = await PropertyService.updatePropertyImages(
				id,
				imageUrls,
				userId,
				userRole
			);

			const response: IApiResponse = {
				success: true,
				message: "Property images uploaded successfully",
				data: { property },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Upload property images error:", error);

			const response: IApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "Image upload failed",
			};

			res.status(400).json(response);
		}
	}

	// Delete property image
	static async deletePropertyImage(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { imageUrl } = req.body;

			// Get property to check ownership
			const property = await PropertyService.getPropertyById(id);
			if (!property) {
				const response: IApiResponse = {
					success: false,
					message: "Property not found",
				};
				res.status(404).json(response);
				return;
			}

			// Check authorization
			const userId = req.user!._id;
			const userRole = req.user!.role;
			const canUpdate =
				property.owner.toString() === userId ||
				["admin", "super_admin"].includes(userRole);

			if (!canUpdate) {
				const response: IApiResponse = {
					success: false,
					message: "You are not authorized to update this property",
				};
				res.status(403).json(response);
				return;
			}

			// Delete image from S3
			await FileService.deleteFile(imageUrl);

			// Remove image from property
			const updatedImages = property.images.filter(
				(img: string) => img !== imageUrl
			);
			const updatedProperty = await PropertyService.updatePropertyImages(
				id,
				updatedImages,
				userId,
				userRole
			);

			const response: IApiResponse = {
				success: true,
				message: "Property image deleted successfully",
				data: { property: updatedProperty },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Delete property image error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Image deletion failed",
			};

			res.status(400).json(response);
		}
	}

	// Get property statistics (admin only)
	static async getPropertyStats(req: Request, res: Response): Promise<void> {
		try {
			const stats = await PropertyService.getPropertyStats();

			const response: IApiResponse = {
				success: true,
				message: "Property statistics retrieved successfully",
				data: { stats },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get property stats error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve property statistics",
			};

			res.status(500).json(response);
		}
	}
}
