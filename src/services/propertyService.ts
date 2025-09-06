import Property, { IProperty } from "../models/Property";
import User from "../models/User";
import { logger } from "../config/logger";
import { IQueryParams } from "../types";

export class PropertyService {
	// Create new property
	static async createProperty(
		propertyData: Partial<IProperty>,
		agentId: string,
		userRole?: string
	): Promise<IProperty> {
		try {
			// Verify agent exists
			const agent = await User.findById(agentId);
			if (!agent) {
				throw new Error("Property agent not found");
			}

			// Auto-approve if user is super_admin
			const isAutoApproved = userRole === "super_admin";

			const property = new Property({
				...propertyData,
				agent: agentId,
				approvalStatus: isAutoApproved ? "approved" : "pending",
				...(isAutoApproved && {
					approvedBy: agentId,
					approvedAt: new Date(),
				}),
			});

			await property.save();
			await property.populate("agent", "firstName lastName email");

			const statusMessage = isAutoApproved
				? " (auto-approved)"
				: " (pending approval)";
			logger.info(
				`New property created: ${property.title} by ${agent.email}${statusMessage}`
			);

			return property;
		} catch (error) {
			logger.error("Property creation error:", error);
			throw error;
		}
	}

	// Get property by ID
	static async getPropertyById(
		propertyId: string,
		byAdmin: boolean = false
	): Promise<IProperty | null> {
		try {
			if (byAdmin) {
				return await Property.findById(propertyId).populate(
					"agent",
					"firstName lastName email phone"
				);
			} else {
				return await Property.findById(propertyId)
					.select("-owner")
					.populate("agent", "firstName lastName email phone");
			}
		} catch (error) {
			logger.error("Get property by ID error:", error);
			throw error;
		}
	}

	// Get all properties with filtering and pagination
	static async getAllProperties(
		queryParams: IQueryParams,
		userRole?: string,
		userId?: string
	): Promise<{
		properties: IProperty[];
		total: number;
		pages: number;
	}> {
		try {
			const {
				page = 1,
				limit = 10,
				sort = "-createdAt",
				search,
				filter = {},
			} = queryParams;

			const query: any = {};
			const conditions: any[] = [];

			// Filter by approval status based on user role
			let approvalCondition: any;
			if (userRole === "super_admin") {
				console.log("Super admin");
				// Super admins can see all properties
				if (filter.approvalStatus) {
					approvalCondition = { approvalStatus: filter.approvalStatus };
				} else {
					// Show all properties except rejected (pending + approved)
					approvalCondition = {
						approvalStatus: { $in: ["pending", "approved"] },
					};
				}
			} else {
				// Regular users can see:
				// 1. All approved properties (from any user)
				// 2. Their own pending/rejected properties
				console.log("Regular user", userId);
				approvalCondition = {
					$or: [
						{ approvalStatus: "approved" },
						{
							$and: [
								{ agent: userId },
								{ approvalStatus: { $in: ["pending", "rejected"] } },
							],
						},
					],
				};
			}
			conditions.push(approvalCondition);

			// Add search functionality
			if (search) {
				conditions.push({
					$or: [
						{ title: { $regex: search, $options: "i" } },
						{ description: { $regex: search, $options: "i" } },
						{ location: { $regex: search, $options: "i" } },
					],
				});
			}

			// Add filters
			if (filter.propertyType) {
				query.propertyType = filter.propertyType;
			}
			if (filter.propertyFor) {
				query.propertyFor = filter.propertyFor;
			}
			if (filter.status) {
				query.status = filter.status;
			}
			if (filter.minPrice || filter.maxPrice) {
				query.price = {};
				if (filter.minPrice) query.price.$gte = filter.minPrice;
				if (filter.maxPrice) query.price.$lte = filter.maxPrice;
			}
			if (filter.minBedrooms) {
				query.bedrooms = { $gte: filter.minBedrooms };
			}
			if (filter.minBathrooms) {
				query.bathrooms = { $gte: filter.minBathrooms };
			}
			// Handle location filtering (city and/or state)
			if (filter.city && filter.state) {
				// Both city and state - location must contain both
				conditions.push({
					$and: [
						{ location: { $regex: filter.city, $options: "i" } },
						{ location: { $regex: filter.state, $options: "i" } },
					],
				});
			} else if (filter.city) {
				// Only city
				query.location = { $regex: filter.city, $options: "i" };
			} else if (filter.state) {
				// Only state
				query.location = { $regex: filter.state, $options: "i" };
			}

			// Combine all conditions
			if (conditions.length > 0) {
				query.$and = conditions;
			}

			const skip = (page - 1) * limit;
			console.log("Final query:", JSON.stringify(query, null, 2));
			const [properties, total] = await Promise.all([
				Property.find(query)
					.populate("agent", "firstName lastName email")
					.sort(sort)
					.skip(skip)
					.limit(limit),
				Property.countDocuments(query),
			]);

			const pages = Math.ceil(total / limit);

			return { properties, total, pages };
		} catch (error) {
			logger.error("Get all properties error:", error);
			throw error;
		}
	}

	// Update property
	static async updateProperty(
		propertyId: string,
		updateData: Partial<IProperty>,
		userId: string,
		userRole: string
	): Promise<IProperty> {
		try {
			const property = await Property.findById(propertyId);

			if (!property) {
				throw new Error("Property not found");
			}

			// Check if user can update this property
			const canUpdate =
				property.agent.toString() === userId.toString() ||
				["super_admin"].includes(userRole);
			console.log(property.agent.toString(), userId.toString(), userRole);
			if (!canUpdate) {
				throw new Error("You are not authorized to update this property");
			}

			const updatedProperty = await Property.findByIdAndUpdate(
				propertyId,
				{ $set: updateData },
				{ new: true, runValidators: true }
			).populate("agent", "firstName lastName email");

			logger.info(`Property updated: ${updatedProperty?.title}`);

			return updatedProperty!;
		} catch (error) {
			logger.error("Property update error:", error);
			throw error;
		}
	}

	// Delete property
	static async deleteProperty(
		propertyId: string,
		userId: string,
		userRole: string
	): Promise<void> {
		try {
			const property = await Property.findById(propertyId);

			if (!property) {
				throw new Error("Property not found");
			}

			// Check if user can delete this property
			const canDelete =
				property.agent.toString() === userId ||
				["admin", "super_admin"].includes(userRole);

			if (!canDelete) {
				throw new Error("You are not authorized to delete this property");
			}

			await Property.findByIdAndDelete(propertyId);

			logger.info(`Property deleted: ${property.title}`);
		} catch (error) {
			logger.error("Property deletion error:", error);
			throw error;
		}
	}

	// Get properties by owner
	static async getPropertiesByOwner(
		ownerId: string,
		page: number = 1,
		limit: number = 10
	): Promise<{
		properties: IProperty[];
		total: number;
		pages: number;
	}> {
		try {
			const skip = (page - 1) * limit;

			const [properties, total] = await Promise.all([
				Property.find({ owner: ownerId })
					.populate("agent", "firstName lastName email")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				Property.countDocuments({ owner: ownerId }),
			]);

			const pages = Math.ceil(total / limit);

			return { properties, total, pages };
		} catch (error) {
			logger.error("Get properties by owner error:", error);
			throw error;
		}
	}

	// Get properties by agent
	static async getPropertiesByAgent(
		agentId: string,
		page: number = 1,
		limit: number = 10
	): Promise<{
		properties: IProperty[];
		total: number;
		pages: number;
	}> {
		try {
			const skip = (page - 1) * limit;

			const [properties, total] = await Promise.all([
				Property.find({ agent: agentId })
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				Property.countDocuments({ agent: agentId }),
			]);

			const pages = Math.ceil(total / limit);

			return { properties, total, pages };
		} catch (error) {
			logger.error("Get properties by agent error:", error);
			throw error;
		}
	}

	// Update property images
	static async updatePropertyImages(
		propertyId: string,
		images: string[],
		userId: string,
		userRole: string
	): Promise<IProperty> {
		try {
			const property = await Property.findById(propertyId);

			if (!property) {
				throw new Error("Property not found");
			}

			// Check if user can update this property
			const canUpdate =
				property.agent.toString() === userId ||
				["admin", "super_admin"].includes(userRole);

			if (!canUpdate) {
				throw new Error("You are not authorized to update this property");
			}

			const updatedProperty = await Property.findByIdAndUpdate(
				propertyId,
				{ images },
				{ new: true, runValidators: true }
			).populate("agent", "firstName lastName email");

			logger.info(`Property images updated: ${updatedProperty?.title}`);

			return updatedProperty!;
		} catch (error) {
			logger.error("Property images update error:", error);
			throw error;
		}
	}

	// Get property statistics
	static async getPropertyStats(): Promise<{
		total: number;
		available: number;
		sold: number;
		rented: number;
		pending: number;
		byType: Record<string, number>;
		avgPrice: number;
	}> {
		try {
			const [total, available, sold, rented, pending, byType, avgPriceResult] =
				await Promise.all([
					Property.countDocuments(),
					Property.countDocuments({ status: "available" }),
					Property.countDocuments({ status: "sold" }),
					Property.countDocuments({ status: "rented" }),
					Property.countDocuments({ status: "pending" }),
					Property.aggregate([
						{ $group: { _id: "$propertyType", count: { $sum: 1 } } },
					]),
					Property.aggregate([
						{ $group: { _id: null, avgPrice: { $avg: "$price" } } },
					]),
				]);

			const byTypeObj = byType.reduce((acc: Record<string, number>, item) => {
				acc[item._id] = item.count;
				return acc;
			}, {});

			const avgPrice =
				avgPriceResult.length > 0 ? Math.round(avgPriceResult[0].avgPrice) : 0;

			return {
				total,
				available,
				sold,
				rented,
				pending,
				byType: byTypeObj,
				avgPrice,
			};
		} catch (error) {
			logger.error("Get property stats error:", error);
			throw error;
		}
	}

	// Get pending properties for approval
	static async getPendingProperties(queryParams: IQueryParams): Promise<{
		properties: IProperty[];
		total: number;
		pages: number;
	}> {
		try {
			const { page = 1, limit = 10, sort = "-createdAt", search } = queryParams;

			const query: any = { approvalStatus: "pending" };

			// Add search functionality
			if (search) {
				query.$or = [
					{ title: { $regex: search, $options: "i" } },
					{ description: { $regex: search, $options: "i" } },
					{ location: { $regex: search, $options: "i" } },
				];
			}

			const skip = (page - 1) * limit;
			const total = await Property.countDocuments(query);
			const pages = Math.ceil(total / limit);

			const properties = await Property.find(query)
				.populate("agent", "firstName lastName email")
				.populate("approvedBy", "firstName lastName email")
				.sort(sort)
				.skip(skip)
				.limit(limit);

			return { properties, total, pages };
		} catch (error) {
			logger.error("Get pending properties error:", error);
			throw error;
		}
	}

	// Approve property
	static async approveProperty(
		propertyId: string,
		adminId: string
	): Promise<IProperty> {
		try {
			const property = await Property.findById(propertyId);
			if (!property) {
				throw new Error("Property not found");
			}

			if (property.approvalStatus !== "pending") {
				throw new Error("Property is not in pending status");
			}

			property.approvalStatus = "approved";
			property.approvedBy = adminId as any;
			property.approvedAt = new Date();
			property.rejectionReason = undefined;

			await property.save();
			await property.populate("agent", "firstName lastName email");
			await property.populate("approvedBy", "firstName lastName email");

			logger.info(`Property approved: ${property.title} by admin ${adminId}`);

			return property;
		} catch (error) {
			logger.error("Property approval error:", error);
			throw error;
		}
	}

	// Reject property
	static async rejectProperty(
		propertyId: string,
		adminId: string,
		rejectionReason: string
	): Promise<IProperty> {
		try {
			const property = await Property.findById(propertyId);
			if (!property) {
				throw new Error("Property not found");
			}

			if (property.approvalStatus !== "pending") {
				throw new Error("Property is not in pending status");
			}

			property.approvalStatus = "rejected";
			property.approvedBy = adminId as any;
			property.approvedAt = new Date();
			property.rejectionReason = rejectionReason;

			await property.save();
			await property.populate("agent", "firstName lastName email");
			await property.populate("approvedBy", "firstName lastName email");

			logger.info(`Property rejected: ${property.title} by admin ${adminId}`);

			return property;
		} catch (error) {
			logger.error("Property rejection error:", error);
			throw error;
		}
	}

	// Bulk approve properties
	static async bulkApproveProperties(
		propertyIds: string[],
		adminId: string
	): Promise<{
		approved: IProperty[];
		errors?: Array<{ propertyId: string; error: string }>;
	}> {
		try {
			const approved: IProperty[] = [];
			const errors: Array<{ propertyId: string; error: string }> = [];

			for (const propertyId of propertyIds) {
				try {
					const property = await this.approveProperty(propertyId, adminId);
					approved.push(property);
				} catch (error) {
					errors.push({
						propertyId,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return { approved, errors: errors.length > 0 ? errors : undefined };
		} catch (error) {
			logger.error("Bulk property approval error:", error);
			throw error;
		}
	}

	// Bulk reject properties
	static async bulkRejectProperties(
		propertyIds: string[],
		adminId: string,
		rejectionReason: string
	): Promise<{
		rejected: IProperty[];
		errors?: Array<{ propertyId: string; error: string }>;
	}> {
		try {
			const rejected: IProperty[] = [];
			const errors: Array<{ propertyId: string; error: string }> = [];

			for (const propertyId of propertyIds) {
				try {
					const property = await this.rejectProperty(
						propertyId,
						adminId,
						rejectionReason
					);
					rejected.push(property);
				} catch (error) {
					errors.push({
						propertyId,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return { rejected, errors: errors.length > 0 ? errors : undefined };
		} catch (error) {
			logger.error("Bulk property rejection error:", error);
			throw error;
		}
	}
}
