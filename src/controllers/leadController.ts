import { Request, Response } from "express";
import { LeadService } from "../services/leadService";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

export class LeadController {
	// Create new lead (public endpoint for landing page)
	static async createLead(req: Request, res: Response): Promise<void> {
		try {
			const leadData = req.body;

			// Calculate lead score
			const leadScore = LeadService.calculateLeadScore(leadData);
			leadData.leadScore = leadScore;

			const lead = await LeadService.createLead(leadData);

			const response: IApiResponse = {
				success: true,
				message: "Lead created successfully",
				data: { lead },
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error("Create lead error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Lead creation failed",
			};

			res.status(400).json(response);
		}
	}

	// Get lead by ID
	static async getLeadById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const lead = await LeadService.getLeadById(id);

			if (!lead) {
				const response: IApiResponse = {
					success: false,
					message: "Lead not found",
				};
				res.status(404).json(response);
				return;
			}

			const response: IApiResponse = {
				success: true,
				message: "Lead retrieved successfully",
				data: { lead },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get lead by ID error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve lead",
			};

			res.status(500).json(response);
		}
	}

	// Get all leads
	static async getAllLeads(req: Request, res: Response): Promise<void> {
		try {
			const queryParams = {
				page: parseInt(req.query.page as string) || 1,
				limit: parseInt(req.query.limit as string) || 10,
				sort: (req.query.sort as string) || "-createdAt",
				search: req.query.search as string,
				filter: {
					status: req.query.status as string,
					priority: req.query.priority as string,
					source: req.query.source as string,
					assignedTo: req.query.assignedTo as string,
					unassigned: req.query.unassigned as string,
					minLeadScore: req.query.minLeadScore
						? parseInt(req.query.minLeadScore as string)
						: undefined,
					maxLeadScore: req.query.maxLeadScore
						? parseInt(req.query.maxLeadScore as string)
						: undefined,
					dateFrom: req.query.dateFrom as string,
					dateTo: req.query.dateTo as string,
				},
			};

			const result = await LeadService.getAllLeads(queryParams);

			const response: IApiResponse = {
				success: true,
				message: "Leads retrieved successfully",
				data: { leads: result.leads },
				pagination: {
					page: queryParams.page,
					limit: queryParams.limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get all leads error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve leads",
			};

			res.status(500).json(response);
		}
	}

	// Update lead
	static async updateLead(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const userId = req.user!._id;
			const userRole = req.user!.role;

			const lead = await LeadService.updateLead(
				id,
				updateData,
				userId,
				userRole
			);

			const response: IApiResponse = {
				success: true,
				message: "Lead updated successfully",
				data: { lead },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Update lead error:", error);

			const response: IApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "Lead update failed",
			};

			res.status(400).json(response);
		}
	}

	// Assign lead to user
	static async assignLead(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { assignedTo } = req.body;
			const assignedBy = req.user!._id;

			const lead = await LeadService.assignLead(id, assignedTo, assignedBy);

			const response: IApiResponse = {
				success: true,
				message: "Lead assigned successfully",
				data: { lead },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Assign lead error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Lead assignment failed",
			};

			res.status(400).json(response);
		}
	}

	// Unassign lead
	static async unassignLead(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user!._id;
			const userRole = req.user!.role;

			const lead = await LeadService.unassignLead(id, userId, userRole);

			const response: IApiResponse = {
				success: true,
				message: "Lead unassigned successfully",
				data: { lead },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Unassign lead error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Lead unassignment failed",
			};

			res.status(400).json(response);
		}
	}

	// Update lead status
	static async updateLeadStatus(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { status } = req.body;
			const userId = req.user!._id;
			const userRole = req.user!.role;

			const lead = await LeadService.updateLeadStatus(
				id,
				status,
				userId,
				userRole
			);

			const response: IApiResponse = {
				success: true,
				message: "Lead status updated successfully",
				data: { lead },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Update lead status error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Lead status update failed",
			};

			res.status(400).json(response);
		}
	}

	// Get leads by assigned user
	static async getLeadsByAssignedUser(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { userId } = req.params;
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;

			const result = await LeadService.getLeadsByAssignedUser(
				userId,
				page,
				limit
			);

			const response: IApiResponse = {
				success: true,
				message: "Leads retrieved successfully",
				data: { leads: result.leads },
				pagination: {
					page,
					limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get leads by assigned user error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve leads",
			};

			res.status(500).json(response);
		}
	}

	// Get unassigned leads
	static async getUnassignedLeads(req: Request, res: Response): Promise<void> {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;

			const result = await LeadService.getUnassignedLeads(page, limit);

			const response: IApiResponse = {
				success: true,
				message: "Unassigned leads retrieved successfully",
				data: { leads: result.leads },
				pagination: {
					page,
					limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get unassigned leads error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve unassigned leads",
			};

			res.status(500).json(response);
		}
	}

	// Get lead statistics
	static async getLeadStats(req: Request, res: Response): Promise<void> {
		try {
			const stats = await LeadService.getLeadStats();

			const response: IApiResponse = {
				success: true,
				message: "Lead statistics retrieved successfully",
				data: { stats },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get lead stats error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve lead statistics",
			};

			res.status(500).json(response);
		}
	}

	// Bulk assign leads
	static async bulkAssignLeads(req: Request, res: Response): Promise<void> {
		try {
			const { leadIds, assignedTo } = req.body;
			const assignedBy = req.user!._id;

			if (!Array.isArray(leadIds) || leadIds.length === 0) {
				const response: IApiResponse = {
					success: false,
					message: "Lead IDs array is required",
				};
				res.status(400).json(response);
				return;
			}

			const results = [];
			const errors = [];

			for (const leadId of leadIds) {
				try {
					const lead = await LeadService.assignLead(
						leadId,
						assignedTo,
						assignedBy
					);
					results.push(lead);
				} catch (error) {
					errors.push({
						leadId,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			const response: IApiResponse = {
				success: true,
				message: `Bulk assignment completed. ${results.length} leads assigned successfully.`,
				data: {
					assigned: results,
					errors: errors.length > 0 ? errors : undefined,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Bulk assign leads error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Bulk assignment failed",
			};

			res.status(400).json(response);
		}
	}
}
