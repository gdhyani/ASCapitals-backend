import Lead, { ILead } from "../models/Lead";
import User from "../models/User";
import { logger } from "../config/logger";
import { IQueryParams } from "../types";

export class LeadService {
	// Create new lead
	static async createLead(leadData: Partial<ILead>): Promise<ILead> {
		try {
			const lead = new Lead(leadData);
			await lead.save();

			logger.info(`New lead created: ${lead.name} - ${lead.phoneNumber}`);
			return lead;
		} catch (error) {
			logger.error("Lead creation error:", error);
			throw error;
		}
	}

	// Get lead by ID
	static async getLeadById(leadId: string): Promise<ILead | null> {
		try {
			return await Lead.findById(leadId)
				.populate("assignedTo", "firstName lastName email phoneNumber")
				.populate("assignedBy", "firstName lastName email");
		} catch (error) {
			logger.error("Get lead by ID error:", error);
			throw error;
		}
	}

	// Get all leads with filtering and pagination
	static async getAllLeads(queryParams: IQueryParams): Promise<{
		leads: ILead[];
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

			// Add search functionality
			if (search) {
				query.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ phoneNumber: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
					{ message: { $regex: search, $options: "i" } },
				];
			}

			// Add filters
			if (filter.status) {
				query.status = filter.status;
			}
			if (filter.priority) {
				query.priority = filter.priority;
			}
			if (filter.source) {
				query.source = filter.source;
			}
			if (filter.assignedTo) {
				query.assignedTo = filter.assignedTo;
			}
			if (filter.unassigned === "true") {
				query.assignedTo = null;
			}
			if (filter.minLeadScore || filter.maxLeadScore) {
				query.leadScore = {};
				if (filter.minLeadScore) query.leadScore.$gte = filter.minLeadScore;
				if (filter.maxLeadScore) query.leadScore.$lte = filter.maxLeadScore;
			}
			if (filter.dateFrom || filter.dateTo) {
				query.createdAt = {};
				if (filter.dateFrom) query.createdAt.$gte = new Date(filter.dateFrom);
				if (filter.dateTo) query.createdAt.$lte = new Date(filter.dateTo);
			}

			const skip = (page - 1) * limit;

			const [leads, total] = await Promise.all([
				Lead.find(query)
					.populate("assignedTo", "firstName lastName email")
					.populate("assignedBy", "firstName lastName email")
					.sort(sort)
					.skip(skip)
					.limit(limit),
				Lead.countDocuments(query),
			]);

			const pages = Math.ceil(total / limit);

			return { leads, total, pages };
		} catch (error) {
			logger.error("Get all leads error:", error);
			throw error;
		}
	}

	// Update lead
	static async updateLead(
		leadId: string,
		updateData: Partial<ILead>,
		userId: string,
		userRole: string
	): Promise<ILead> {
		try {
			const lead = await Lead.findById(leadId);

			if (!lead) {
				throw new Error("Lead not found");
			}

			// Check if user can update this lead
			const canUpdate =
				lead.assignedTo?.toString() === userId ||
				["admin", "super_admin"].includes(userRole);

			if (!canUpdate) {
				throw new Error("You are not authorized to update this lead");
			}

			const updatedLead = await Lead.findByIdAndUpdate(
				leadId,
				{ $set: updateData },
				{ new: true, runValidators: true }
			)
				.populate("assignedTo", "firstName lastName email")
				.populate("assignedBy", "firstName lastName email");

			logger.info(`Lead updated: ${updatedLead?.name}`);

			return updatedLead!;
		} catch (error) {
			logger.error("Lead update error:", error);
			throw error;
		}
	}

	// Assign lead to user
	static async assignLead(
		leadId: string,
		assignedToUserId: string,
		assignedByUserId: string
	): Promise<ILead> {
		try {
			// Verify assigned user exists
			const assignedUser = await User.findById(assignedToUserId);
			if (!assignedUser) {
				throw new Error("Assigned user not found");
			}

			const lead = await Lead.findByIdAndUpdate(
				leadId,
				{
					assignedTo: assignedToUserId,
					assignedBy: assignedByUserId,
					assignedAt: new Date(),
				},
				{ new: true, runValidators: true }
			)
				.populate("assignedTo", "firstName lastName email")
				.populate("assignedBy", "firstName lastName email");

			if (!lead) {
				throw new Error("Lead not found");
			}

			logger.info(
				`Lead ${lead.name} assigned to ${assignedUser.firstName} ${assignedUser.lastName}`
			);

			return lead;
		} catch (error) {
			logger.error("Lead assignment error:", error);
			throw error;
		}
	}

	// Unassign lead
	static async unassignLead(
		leadId: string,
		userId: string,
		userRole: string
	): Promise<ILead> {
		try {
			const lead = await Lead.findById(leadId);

			if (!lead) {
				throw new Error("Lead not found");
			}

			// Check if user can unassign this lead
			const canUnassign =
				lead.assignedTo?.toString() === userId ||
				["admin", "super_admin"].includes(userRole);

			if (!canUnassign) {
				throw new Error("You are not authorized to unassign this lead");
			}

			const updatedLead = await Lead.findByIdAndUpdate(
				leadId,
				{
					assignedTo: null,
					assignedBy: null,
					assignedAt: null,
				},
				{ new: true, runValidators: true }
			)
				.populate("assignedTo", "firstName lastName email")
				.populate("assignedBy", "firstName lastName email");

			logger.info(`Lead ${updatedLead?.name} unassigned`);

			return updatedLead!;
		} catch (error) {
			logger.error("Lead unassignment error:", error);
			throw error;
		}
	}

	// Update lead status
	static async updateLeadStatus(
		leadId: string,
		status: string,
		userId: string,
		userRole: string
	): Promise<ILead> {
		try {
			const lead = await Lead.findById(leadId);

			if (!lead) {
				throw new Error("Lead not found");
			}

			// Check if user can update this lead
			const canUpdate =
				lead.assignedTo?.toString() === userId ||
				["admin", "super_admin"].includes(userRole);

			if (!canUpdate) {
				throw new Error("You are not authorized to update this lead");
			}

			const updateData: any = { status };

			// Update last contacted date if status is contacted
			if (status === "contacted") {
				updateData.lastContactedAt = new Date();
			}

			const updatedLead = await Lead.findByIdAndUpdate(
				leadId,
				{ $set: updateData },
				{ new: true, runValidators: true }
			)
				.populate("assignedTo", "firstName lastName email")
				.populate("assignedBy", "firstName lastName email");

			logger.info(`Lead ${updatedLead?.name} status updated to ${status}`);

			return updatedLead!;
		} catch (error) {
			logger.error("Lead status update error:", error);
			throw error;
		}
	}

	// Get leads by assigned user
	static async getLeadsByAssignedUser(
		userId: string,
		page: number = 1,
		limit: number = 10
	): Promise<{
		leads: ILead[];
		total: number;
		pages: number;
	}> {
		try {
			const skip = (page - 1) * limit;

			const [leads, total] = await Promise.all([
				Lead.find({ assignedTo: userId })
					.populate("assignedBy", "firstName lastName email")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				Lead.countDocuments({ assignedTo: userId }),
			]);

			const pages = Math.ceil(total / limit);

			return { leads, total, pages };
		} catch (error) {
			logger.error("Get leads by assigned user error:", error);
			throw error;
		}
	}

	// Get unassigned leads
	static async getUnassignedLeads(
		page: number = 1,
		limit: number = 10
	): Promise<{
		leads: ILead[];
		total: number;
		pages: number;
	}> {
		try {
			const skip = (page - 1) * limit;

			const [leads, total] = await Promise.all([
				Lead.find({ assignedTo: null })
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				Lead.countDocuments({ assignedTo: null }),
			]);

			const pages = Math.ceil(total / limit);

			return { leads, total, pages };
		} catch (error) {
			logger.error("Get unassigned leads error:", error);
			throw error;
		}
	}

	// Get lead statistics
	static async getLeadStats(): Promise<{
		total: number;
		new: number;
		contacted: number;
		qualified: number;
		converted: number;
		closed: number;
		unassigned: number;
		bySource: Record<string, number>;
		byPriority: Record<string, number>;
		avgLeadScore: number;
		conversionRate: number;
	}> {
		try {
			const [
				total,
				newLeads,
				contacted,
				qualified,
				converted,
				closed,
				unassigned,
				bySource,
				byPriority,
				avgLeadScoreResult,
				conversionRateResult,
			] = await Promise.all([
				Lead.countDocuments(),
				Lead.countDocuments({ status: "new" }),
				Lead.countDocuments({ status: "contacted" }),
				Lead.countDocuments({ status: "qualified" }),
				Lead.countDocuments({ status: "converted" }),
				Lead.countDocuments({ status: "closed" }),
				Lead.countDocuments({ assignedTo: null }),
				Lead.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]),
				Lead.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
				Lead.aggregate([
					{ $group: { _id: null, avgLeadScore: { $avg: "$leadScore" } } },
				]),
				Lead.aggregate([
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
							converted: {
								$sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
							},
						},
					},
					{
						$project: {
							conversionRate: {
								$multiply: [{ $divide: ["$converted", "$total"] }, 100],
							},
						},
					},
				]),
			]);

			const bySourceObj = bySource.reduce(
				(acc: Record<string, number>, item) => {
					acc[item._id] = item.count;
					return acc;
				},
				{}
			);

			const byPriorityObj = byPriority.reduce(
				(acc: Record<string, number>, item) => {
					acc[item._id] = item.count;
					return acc;
				},
				{}
			);

			const avgLeadScore =
				avgLeadScoreResult.length > 0
					? Math.round(avgLeadScoreResult[0].avgLeadScore || 0)
					: 0;

			const conversionRate =
				conversionRateResult.length > 0
					? Math.round(conversionRateResult[0].conversionRate || 0)
					: 0;

			return {
				total,
				new: newLeads,
				contacted,
				qualified,
				converted,
				closed,
				unassigned,
				bySource: bySourceObj,
				byPriority: byPriorityObj,
				avgLeadScore,
				conversionRate,
			};
		} catch (error) {
			logger.error("Get lead stats error:", error);
			throw error;
		}
	}

	// Calculate lead score based on various factors
	static calculateLeadScore(lead: Partial<ILead>): number {
		let score = 0;

		// Base score for having contact info
		if (lead.name) score += 10;
		if (lead.phoneNumber) score += 15;
		if (lead.email) score += 10;

		// Score based on message quality
		if (lead.message) {
			const messageLength = lead.message.length;
			if (messageLength > 50) score += 10;
			if (messageLength > 100) score += 5;
		}

		// Score based on budget information
		if (lead.estimatedBudget) {
			score += 15;
			if (lead.estimatedBudget.min > 0) score += 5;
			if (lead.estimatedBudget.max > 0) score += 5;
		}

		// Score based on location preference
		if (lead.preferredLocation) {
			score += 10;
			if (lead.preferredLocation.city) score += 5;
			if (lead.preferredLocation.state) score += 5;
		}

		// Score based on property interests
		if (lead.propertyInterests && lead.propertyInterests.length > 0) {
			score += lead.propertyInterests.length * 5;
		}

		// Score based on tags
		if (lead.tags && lead.tags.length > 0) {
			score += lead.tags.length * 2;
		}

		// Cap the score at 100
		return Math.min(score, 100);
	}
}
