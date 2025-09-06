import { Request, Response } from "express";
import User from "../models/User";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

export class SuperAdminController {
	// Create super admin (development only)
	static async createSuperAdmin(req: Request, res: Response): Promise<void> {
		try {
			// Only allow in development environment
			if (process.env.NODE_ENV === "production") {
				const response: IApiResponse = {
					success: false,
					message: "Super admin creation is not allowed in production",
				};
				res.status(403).json(response);
				return;
			}

			const {
				email,
				password,
				firstName,
				lastName,
				phoneNumber,
				description,
				position,
			} = req.body;

			// Check if super admin already exists
			const existingSuperAdmin = await User.findOne({ email });
			if (existingSuperAdmin) {
				const response: IApiResponse = {
					success: false,
					message: "Super admin with this email already exists",
				};
				res.status(400).json(response);
				return;
			}

			// Create super admin
			const superAdmin = new User({
				email,
				password,
				firstName,
				lastName,
				role: "super_admin",
				isActive: true,
				isVerified: true,
				verificationStatus: "approved",
				phoneNumber,
				description,
				position,
				rating: 5,
			});

			await superAdmin.save();

			logger.info(`Super admin created: ${email}`);

			const response: IApiResponse = {
				success: true,
				message: "Super admin created successfully",
				data: {
					_id: superAdmin._id,
					email: superAdmin.email,
					firstName: superAdmin.firstName,
					lastName: superAdmin.lastName,
					role: superAdmin.role,
				},
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error("Create super admin error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Super admin creation failed",
			};

			res.status(400).json(response);
		}
	}

	// Get all super admins
	static async getAllSuperAdmins(req: Request, res: Response): Promise<void> {
		try {
			const superAdmins = await User.find({ role: "super_admin" })
				.select("-password")
				.sort({ createdAt: -1 });

			const response: IApiResponse = {
				success: true,
				message: "Super admins retrieved successfully",
				data: { superAdmins },
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get super admins error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve super admins",
			};

			res.status(500).json(response);
		}
	}
}
