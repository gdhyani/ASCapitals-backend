import { Request, Response } from "express";
import { UserVerificationService } from "../services/userVerificationService";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

export class UserVerificationController {
	// Create verification request (called during signup)
	static async createVerificationRequest(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const userData = req.body;

			const verificationRequest =
				await UserVerificationService.createVerificationRequest(userData);

			const response: IApiResponse = {
				success: true,
				message:
					"Verification request created successfully. Please wait for admin approval.",
				data: {
					verificationRequest,
					userId: verificationRequest.userId,
				},
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error("Create verification request error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Verification request creation failed",
			};

			res.status(400).json(response);
		}
	}

	// Get all verification requests
	static async getAllVerificationRequests(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const queryParams = {
				page: parseInt(req.query.page as string) || 1,
				limit: parseInt(req.query.limit as string) || 10,
				sort: (req.query.sort as string) || "-requestedAt",
				search: req.query.search as string,
				filter: {
					status: req.query.status as string,
					dateFrom: req.query.dateFrom as string,
					dateTo: req.query.dateTo as string,
				},
			};

			const result = await UserVerificationService.getAllVerificationRequests(
				queryParams
			);

			const response: IApiResponse = {
				success: true,
				message: "Verification requests retrieved successfully",
				data: { requests: result.requests },
				pagination: {
					page: queryParams.page,
					limit: queryParams.limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get all verification requests error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve verification requests",
			};

			res.status(500).json(response);
		}
	}

	// Get verification request by ID
	static async getVerificationRequestById(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { id } = req.params;

			const request = await UserVerificationService.getVerificationRequestById(
				id
			);

			if (!request) {
				const response: IApiResponse = {
					success: false,
					message: "Verification request not found",
				};
				res.status(404).json(response);
				return;
			}

			const response: IApiResponse = {
				success: true,
				message: "Verification request retrieved successfully",
				data: { request },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get verification request by ID error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve verification request",
			};

			res.status(500).json(response);
		}
	}

	// Get verification request by user ID
	static async getVerificationRequestByUserId(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { userId } = req.params;

			const request =
				await UserVerificationService.getVerificationRequestByUserId(userId);

			if (!request) {
				const response: IApiResponse = {
					success: false,
					message: "Verification request not found",
				};
				res.status(404).json(response);
				return;
			}

			const response: IApiResponse = {
				success: true,
				message: "Verification request retrieved successfully",
				data: { request },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get verification request by user ID error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve verification request",
			};

			res.status(500).json(response);
		}
	}

	// Approve verification request
	static async approveVerificationRequest(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { id } = req.params;
			const { reviewNotes } = req.body;
			const reviewedBy = req.user!._id;

			const request = await UserVerificationService.approveVerificationRequest(
				id,
				reviewedBy,
				reviewNotes
			);

			const response: IApiResponse = {
				success: true,
				message: "User verification approved successfully",
				data: { request },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Approve verification request error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "User verification approval failed",
			};

			res.status(400).json(response);
		}
	}

	// Reject verification request
	static async rejectVerificationRequest(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { id } = req.params;
			const { rejectionReason, reviewNotes } = req.body;
			const reviewedBy = req.user!._id;

			if (!rejectionReason) {
				const response: IApiResponse = {
					success: false,
					message: "Rejection reason is required",
				};
				res.status(400).json(response);
				return;
			}

			const request = await UserVerificationService.rejectVerificationRequest(
				id,
				reviewedBy,
				rejectionReason,
				reviewNotes
			);

			const response: IApiResponse = {
				success: true,
				message: "User verification rejected successfully",
				data: { request },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Reject verification request error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "User verification rejection failed",
			};

			res.status(400).json(response);
		}
	}

	// Get pending verification requests
	static async getPendingVerificationRequests(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;

			const result =
				await UserVerificationService.getPendingVerificationRequests(
					page,
					limit
				);

			const response: IApiResponse = {
				success: true,
				message: "Pending verification requests retrieved successfully",
				data: { requests: result.requests },
				pagination: {
					page,
					limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get pending verification requests error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve pending verification requests",
			};

			res.status(500).json(response);
		}
	}

	// Get verification statistics
	static async getVerificationStats(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const stats = await UserVerificationService.getVerificationStats();

			const response: IApiResponse = {
				success: true,
				message: "Verification statistics retrieved successfully",
				data: { stats },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get verification stats error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve verification statistics",
			};

			res.status(500).json(response);
		}
	}

	// Bulk approve verification requests
	static async bulkApproveVerificationRequests(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { requestIds, reviewNotes } = req.body;
			const reviewedBy = req.user!._id;

			if (!Array.isArray(requestIds) || requestIds.length === 0) {
				const response: IApiResponse = {
					success: false,
					message: "Request IDs array is required",
				};
				res.status(400).json(response);
				return;
			}

			const result =
				await UserVerificationService.bulkApproveVerificationRequests(
					requestIds,
					reviewedBy,
					reviewNotes
				);

			const response: IApiResponse = {
				success: true,
				message: `Bulk approval completed. ${result.approved.length} requests approved successfully.`,
				data: {
					approved: result.approved,
					errors: result.errors.length > 0 ? result.errors : undefined,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Bulk approve verification requests error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Bulk approval failed",
			};

			res.status(400).json(response);
		}
	}

	// Bulk reject verification requests
	static async bulkRejectVerificationRequests(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { requestIds, rejectionReason, reviewNotes } = req.body;
			const reviewedBy = req.user!._id;

			if (!Array.isArray(requestIds) || requestIds.length === 0) {
				const response: IApiResponse = {
					success: false,
					message: "Request IDs array is required",
				};
				res.status(400).json(response);
				return;
			}

			if (!rejectionReason) {
				const response: IApiResponse = {
					success: false,
					message: "Rejection reason is required",
				};
				res.status(400).json(response);
				return;
			}

			const result =
				await UserVerificationService.bulkRejectVerificationRequests(
					requestIds,
					reviewedBy,
					rejectionReason,
					reviewNotes
				);

			const response: IApiResponse = {
				success: true,
				message: `Bulk rejection completed. ${result.rejected.length} requests rejected successfully.`,
				data: {
					rejected: result.rejected,
					errors: result.errors.length > 0 ? result.errors : undefined,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Bulk reject verification requests error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Bulk rejection failed",
			};

			res.status(400).json(response);
		}
	}
}
