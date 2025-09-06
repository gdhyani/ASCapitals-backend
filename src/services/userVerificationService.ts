import User, { IUser } from "../models/User";
import UserVerificationRequest, {
	IUserVerificationRequest,
} from "../models/UserVerificationRequest";
import { logger } from "../config/logger";
import { IQueryParams } from "../types";

export class UserVerificationService {
	// Create verification request when user signs up
	static async createVerificationRequest(
		userData: Partial<IUser>
	): Promise<IUserVerificationRequest> {
		try {
			// Create the user first (with pending verification status)
			const user = new User({
				...userData,
				verificationStatus: "pending",
				isVerified: false,
			});
			await user.save();

			// Create verification request
			const verificationRequest = new UserVerificationRequest({
				userId: user._id,
				userDetails: {
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					phoneNumber: user.phoneNumber,
					description: user.description,
					position: user.position,
					rating: user.rating,
					profileImage: user.profileImage,
				},
			});

			await verificationRequest.save();

			logger.info(`Verification request created for user: ${user.email}`);
			return verificationRequest;
		} catch (error) {
			logger.error("Create verification request error:", error);
			throw error;
		}
	}

	// Get all verification requests with filtering and pagination
	static async getAllVerificationRequests(queryParams: IQueryParams): Promise<{
		requests: IUserVerificationRequest[];
		total: number;
		pages: number;
	}> {
		try {
			const {
				page = 1,
				limit = 10,
				sort = "-requestedAt",
				search,
				filter = {},
			} = queryParams;

			const query: any = {};

			// Add search functionality
			if (search) {
				query.$or = [
					{ "userDetails.firstName": { $regex: search, $options: "i" } },
					{ "userDetails.lastName": { $regex: search, $options: "i" } },
					{ "userDetails.email": { $regex: search, $options: "i" } },
					{ "userDetails.position": { $regex: search, $options: "i" } },
				];
			}

			// Add filters
			if (filter.status) {
				query.status = filter.status;
			}
			if (filter.dateFrom || filter.dateTo) {
				query.requestedAt = {};
				if (filter.dateFrom) query.requestedAt.$gte = new Date(filter.dateFrom);
				if (filter.dateTo) query.requestedAt.$lte = new Date(filter.dateTo);
			}

			const skip = (page - 1) * limit;

			const [requests, total] = await Promise.all([
				UserVerificationRequest.find(query)
					.populate("userId", "firstName lastName email")
					.populate("reviewedBy", "firstName lastName email")
					.sort(sort)
					.skip(skip)
					.limit(limit),
				UserVerificationRequest.countDocuments(query),
			]);

			const pages = Math.ceil(total / limit);

			return { requests, total, pages };
		} catch (error) {
			logger.error("Get all verification requests error:", error);
			throw error;
		}
	}

	// Get verification request by ID
	static async getVerificationRequestById(
		requestId: string
	): Promise<IUserVerificationRequest | null> {
		try {
			return await UserVerificationRequest.findById(requestId)
				.populate("userId", "firstName lastName email")
				.populate("reviewedBy", "firstName lastName email");
		} catch (error) {
			logger.error("Get verification request by ID error:", error);
			throw error;
		}
	}

	// Get verification request by user ID
	static async getVerificationRequestByUserId(
		userId: string
	): Promise<IUserVerificationRequest | null> {
		try {
			return await UserVerificationRequest.findByUserId(userId);
		} catch (error) {
			logger.error("Get verification request by user ID error:", error);
			throw error;
		}
	}

	// Approve user verification request
	static async approveVerificationRequest(
		requestId: string,
		reviewedBy: string,
		reviewNotes?: string
	): Promise<IUserVerificationRequest> {
		try {
			const request = await UserVerificationRequest.findById(requestId);

			if (!request) {
				throw new Error("Verification request not found");
			}

			if (request.status !== "pending") {
				throw new Error("Request has already been processed");
			}

			// Update the verification request
			const updatedRequest = await UserVerificationRequest.findByIdAndUpdate(
				requestId,
				{
					status: "approved",
					reviewedBy,
					reviewedAt: new Date(),
					reviewNotes,
				},
				{ new: true, runValidators: true }
			)
				.populate("userId", "firstName lastName email")
				.populate("reviewedBy", "firstName lastName email");

			// Update the user's verification status
			await User.findByIdAndUpdate(request.userId, {
				verificationStatus: "approved",
				isVerified: true,
				verifiedBy: reviewedBy,
				verifiedAt: new Date(),
			});

			logger.info(
				`User verification approved: ${updatedRequest?.userDetails.email}`
			);

			return updatedRequest!;
		} catch (error) {
			logger.error("Approve verification request error:", error);
			throw error;
		}
	}

	// Reject user verification request
	static async rejectVerificationRequest(
		requestId: string,
		reviewedBy: string,
		rejectionReason: string,
		reviewNotes?: string
	): Promise<IUserVerificationRequest> {
		try {
			const request = await UserVerificationRequest.findById(requestId);

			if (!request) {
				throw new Error("Verification request not found");
			}

			if (request.status !== "pending") {
				throw new Error("Request has already been processed");
			}

			// Update the verification request
			const updatedRequest = await UserVerificationRequest.findByIdAndUpdate(
				requestId,
				{
					status: "rejected",
					reviewedBy,
					reviewedAt: new Date(),
					rejectionReason,
					reviewNotes,
				},
				{ new: true, runValidators: true }
			)
				.populate("userId", "firstName lastName email")
				.populate("reviewedBy", "firstName lastName email");

			// Update the user's verification status
			await User.findByIdAndUpdate(request.userId, {
				verificationStatus: "rejected",
				isVerified: false,
				verifiedBy: reviewedBy,
				verifiedAt: new Date(),
				rejectionReason,
			});

			logger.info(
				`User verification rejected: ${updatedRequest?.userDetails.email}`
			);

			return updatedRequest!;
		} catch (error) {
			logger.error("Reject verification request error:", error);
			throw error;
		}
	}

	// Get pending verification requests
	static async getPendingVerificationRequests(
		page: number = 1,
		limit: number = 10
	): Promise<{
		requests: IUserVerificationRequest[];
		total: number;
		pages: number;
	}> {
		try {
			const skip = (page - 1) * limit;

			const [requests, total] = await Promise.all([
				UserVerificationRequest.findPendingRequests().skip(skip).limit(limit),
				UserVerificationRequest.countDocuments({ status: "pending" }),
			]);

			const pages = Math.ceil(total / limit);

			return { requests, total, pages };
		} catch (error) {
			logger.error("Get pending verification requests error:", error);
			throw error;
		}
	}

	// Get verification statistics
	static async getVerificationStats(): Promise<{
		total: number;
		pending: number;
		approved: number;
		rejected: number;
		pendingToday: number;
		approvedToday: number;
		rejectedToday: number;
		averageProcessingTime: number; // in hours
	}> {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const [
				total,
				pending,
				approved,
				rejected,
				pendingToday,
				approvedToday,
				rejectedToday,
				processingTimeData,
			] = await Promise.all([
				UserVerificationRequest.countDocuments(),
				UserVerificationRequest.countDocuments({ status: "pending" }),
				UserVerificationRequest.countDocuments({ status: "approved" }),
				UserVerificationRequest.countDocuments({ status: "rejected" }),
				UserVerificationRequest.countDocuments({
					status: "pending",
					requestedAt: { $gte: today },
				}),
				UserVerificationRequest.countDocuments({
					status: "approved",
					reviewedAt: { $gte: today },
				}),
				UserVerificationRequest.countDocuments({
					status: "rejected",
					reviewedAt: { $gte: today },
				}),
				UserVerificationRequest.aggregate([
					{
						$match: {
							status: { $in: ["approved", "rejected"] },
							reviewedAt: { $exists: true },
						},
					},
					{
						$project: {
							processingTime: {
								$divide: [
									{ $subtract: ["$reviewedAt", "$requestedAt"] },
									1000 * 60 * 60, // Convert to hours
								],
							},
						},
					},
					{
						$group: {
							_id: null,
							averageProcessingTime: { $avg: "$processingTime" },
						},
					},
				]),
			]);

			const averageProcessingTime =
				processingTimeData.length > 0
					? Math.round(processingTimeData[0].averageProcessingTime || 0)
					: 0;

			return {
				total,
				pending,
				approved,
				rejected,
				pendingToday,
				approvedToday,
				rejectedToday,
				averageProcessingTime,
			};
		} catch (error) {
			logger.error("Get verification stats error:", error);
			throw error;
		}
	}

	// Bulk approve verification requests
	static async bulkApproveVerificationRequests(
		requestIds: string[],
		reviewedBy: string,
		reviewNotes?: string
	): Promise<{
		approved: IUserVerificationRequest[];
		errors: Array<{ requestId: string; error: string }>;
	}> {
		try {
			const results = [];
			const errors = [];

			for (const requestId of requestIds) {
				try {
					const request = await this.approveVerificationRequest(
						requestId,
						reviewedBy,
						reviewNotes
					);
					results.push(request);
				} catch (error) {
					errors.push({
						requestId,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return { approved: results, errors };
		} catch (error) {
			logger.error("Bulk approve verification requests error:", error);
			throw error;
		}
	}

	// Bulk reject verification requests
	static async bulkRejectVerificationRequests(
		requestIds: string[],
		reviewedBy: string,
		rejectionReason: string,
		reviewNotes?: string
	): Promise<{
		rejected: IUserVerificationRequest[];
		errors: Array<{ requestId: string; error: string }>;
	}> {
		try {
			const results = [];
			const errors = [];

			for (const requestId of requestIds) {
				try {
					const request = await this.rejectVerificationRequest(
						requestId,
						reviewedBy,
						rejectionReason,
						reviewNotes
					);
					results.push(request);
				} catch (error) {
					errors.push({
						requestId,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return { rejected: results, errors };
		} catch (error) {
			logger.error("Bulk reject verification requests error:", error);
			throw error;
		}
	}
}
