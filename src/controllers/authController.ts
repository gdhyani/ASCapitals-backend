import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

export class AuthController {
	// Register new user
	static async register(req: Request, res: Response): Promise<void> {
		try {
			const {
				email,
				password,
				firstName,
				lastName,
				phoneNumber,
				description,
				position,
				rating,
			} = req.body;

			const result = await AuthService.registerUser({
				email,
				password,
				firstName,
				lastName,
				phoneNumber,
				description,
				position,
				rating,
			});

			const response: IApiResponse = {
				success: true,
				message: result.message,
				data: {
					userId: result.userId,
				},
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error("Registration error:", error);

			const response: IApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "Registration failed",
			};

			res.status(400).json(response);
		}
	}

	// Login user
	static async login(req: Request, res: Response): Promise<void> {
		try {
			const { email, password } = req.body;

			const result = await AuthService.loginUser(email, password);

			const response: IApiResponse = {
				success: true,
				message: "Login successful",
				data: {
					user: result.user,
					token: result.token,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Login error:", error);

			const response: IApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "Login failed",
			};

			res.status(401).json(response);
		}
	}

	// Get current user profile
	static async getProfile(req: Request, res: Response): Promise<void> {
		try {
			const user = req.user!;

			const response: IApiResponse = {
				success: true,
				message: "Profile retrieved successfully",
				data: {
					user
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get profile error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve profile",
			};

			res.status(500).json(response);
		}
	}

	// Update user profile
	static async updateProfile(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user!._id;
			const updateData = req.body;

			const updatedUser = await AuthService.updateProfile(userId, updateData);

			const response: IApiResponse = {
				success: true,
				message: "Profile updated successfully",
				data: {
					user: updatedUser,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Update profile error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Profile update failed",
			};

			res.status(400).json(response);
		}
	}

	// Change password
	static async changePassword(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user!._id;
			const { currentPassword, newPassword } = req.body;

			await AuthService.changePassword(userId, currentPassword, newPassword);

			const response: IApiResponse = {
				success: true,
				message: "Password changed successfully",
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Change password error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error ? error.message : "Password change failed",
			};

			res.status(400).json(response);
		}
	}

	// Deactivate account
	static async deactivateAccount(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user!._id;

			await AuthService.deactivateAccount(userId);

			const response: IApiResponse = {
				success: true,
				message: "Account deactivated successfully",
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Deactivate account error:", error);

			const response: IApiResponse = {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Account deactivation failed",
			};

			res.status(400).json(response);
		}
	}

	// Get all users (admin only)
	static async getAllUsers(req: Request, res: Response): Promise<void> {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;
			const search = req.query.search as string;

			const result = await AuthService.getAllUsers(page, limit, search);

			const response: IApiResponse = {
				success: true,
				message: "Users retrieved successfully",
				data: {
					users: result.users.map((user) => ({
						_id: user._id,
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName,
						role: user.role,
						isActive: user.isActive,
						phoneNumber: user.phoneNumber,
						createdAt: user.createdAt,
					})),
				},
				pagination: {
					page,
					limit,
					total: result.total,
					pages: result.pages,
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get all users error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve users",
			};

			res.status(500).json(response);
		}
	}

	// Get user by ID (admin only)
	static async getUserById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const user = await AuthService.getUserById(id);

			if (!user) {
				const response: IApiResponse = {
					success: false,
					message: "User not found",
				};
				res.status(404).json(response);
				return;
			}

			const response: IApiResponse = {
				success: true,
				message: "User retrieved successfully",
				data: {
					user: {
						_id: user._id,
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName,
						role: user.role,
						isActive: user.isActive,
						phoneNumber: user.phoneNumber,
						profileImage: user.profileImage,
						address: user.address,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
					},
				},
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error("Get user by ID error:", error);

			const response: IApiResponse = {
				success: false,
				message: "Failed to retrieve user",
			};

			res.status(500).json(response);
		}
	}
}
