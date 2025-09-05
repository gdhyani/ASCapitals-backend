import jwt, { SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";
import User, { IUser } from "../models/User";
import { logger } from "../config/logger";
import { IJWTPayload } from "../types";

export class AuthService {
	// Generate JWT token
	static generateToken(userId: string, email: string, role: string): string {
		const payload: IJWTPayload = {
			userId,
			email,
			role,
		};

		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error("JWT_SECRET environment variable is not set");
		}

		const options: SignOptions = {
			expiresIn: (process.env.JWT_EXPIRE || "7d") as StringValue,
		};
		return jwt.sign(payload, secret, options);
	}

	// Generate refresh token
	static generateRefreshToken(userId: string): string {
		const secret = process.env.JWT_REFRESH_SECRET;
		if (!secret) {
			throw new Error("JWT_REFRESH_SECRET environment variable is not set");
		}

		const options: SignOptions = {
			expiresIn: (process.env.JWT_REFRESH_EXPIRE || "30d") as StringValue,
		};
		return jwt.sign({ userId }, secret, options);
	}

	// Verify JWT token
	static verifyToken(token: string): IJWTPayload {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error("JWT_SECRET environment variable is not set");
		}
		return jwt.verify(token, secret) as IJWTPayload;
	}

	// Verify refresh token
	static verifyRefreshToken(token: string): { userId: string } {
		const secret = process.env.JWT_REFRESH_SECRET;
		if (!secret) {
			throw new Error("JWT_REFRESH_SECRET environment variable is not set");
		}
		return jwt.verify(token, secret) as { userId: string };
	}

	// Register new user (creates verification request)
	static async registerUser(userData: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		phoneNumber?: string;
		description?: string;
		position?: string;
		rating?: number;
	}): Promise<{ message: string; userId: string }> {
		try {
			// Check if user already exists
			const existingUser = await User.findByEmail(userData.email);
			if (existingUser) {
				throw new Error("User with this email already exists");
			}

			// Import UserVerificationService dynamically to avoid circular dependency
			const { UserVerificationService } = await import(
				"./userVerificationService"
			);

			// Create verification request (this will create the user with pending status)
			const verificationRequest =
				await UserVerificationService.createVerificationRequest(userData);

			logger.info(`New user registration request created: ${userData.email}`);

			return {
				message:
					"Registration successful. Please wait for admin approval to access your account.",
				userId: verificationRequest.userId.toString(),
			};
		} catch (error) {
			logger.error("User registration error:", error);
			throw error;
		}
	}

	// Login user
	static async loginUser(
		email: string,
		password: string
	): Promise<{ user: IUser; token: string }> {
		try {
			// Find user by email and include password
			const user = await User.findByEmail(email).select("+password");

			if (!user) {
				throw new Error("Invalid email or password");
			}

			// Check if user is active
			if (!user.isActive) {
				throw new Error("Account is deactivated");
			}

			// Compare password
			const isPasswordValid = await user.comparePassword(password);
			if (!isPasswordValid) {
				throw new Error("Invalid email or password");
			}

			// Check if user is verified (except for super admins)
			if (user.role !== "super_admin" && !user.isVerified) {
				throw new Error(
					"Account is pending verification. Please wait for admin approval."
				);
			}

			// Generate token
			const token = this.generateToken(user._id, user.email, user.role);

			logger.info(`User logged in: ${user.email}`);

			return { user, token };
		} catch (error) {
			logger.error("User login error:", error);
			throw error;
		}
	}

	// Change password
	static async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<void> {
		try {
			const user = await User.findById(userId).select("+password");

			if (!user) {
				throw new Error("User not found");
			}

			// Verify current password
			const isCurrentPasswordValid = await user.comparePassword(
				currentPassword
			);
			if (!isCurrentPasswordValid) {
				throw new Error("Current password is incorrect");
			}

			// Update password
			user.password = newPassword;
			await user.save();

			logger.info(`Password changed for user: ${user.email}`);
		} catch (error) {
			logger.error("Password change error:", error);
			throw error;
		}
	}

	// Update user profile
	static async updateProfile(
		userId: string,
		updateData: Partial<IUser>
	): Promise<IUser> {
		try {
			const user = await User.findByIdAndUpdate(
				userId,
				{ $set: updateData },
				{ new: true, runValidators: true }
			);

			if (!user) {
				throw new Error("User not found");
			}

			logger.info(`Profile updated for user: ${user.email}`);

			return user;
		} catch (error) {
			logger.error("Profile update error:", error);
			throw error;
		}
	}

	// Deactivate user account
	static async deactivateAccount(userId: string): Promise<void> {
		try {
			const user = await User.findByIdAndUpdate(
				userId,
				{ isActive: false },
				{ new: true }
			);

			if (!user) {
				throw new Error("User not found");
			}

			logger.info(`Account deactivated for user: ${user.email}`);
		} catch (error) {
			logger.error("Account deactivation error:", error);
			throw error;
		}
	}

	// Get user by ID
	static async getUserById(userId: string): Promise<IUser | null> {
		try {
			return await User.findById(userId);
		} catch (error) {
			logger.error("Get user by ID error:", error);
			throw error;
		}
	}

	// Get all users (admin only)
	static async getAllUsers(
		page: number = 1,
		limit: number = 10,
		search?: string
	): Promise<{
		users: IUser[];
		total: number;
		pages: number;
	}> {
		try {
			const query: any = {};

			if (search) {
				query.$or = [
					{ firstName: { $regex: search, $options: "i" } },
					{ lastName: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
				];
			}

			const skip = (page - 1) * limit;

			const [users, total] = await Promise.all([
				User.find(query)
					.select("-password")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				User.countDocuments(query),
			]);

			const pages = Math.ceil(total / limit);

			return { users, total, pages };
		} catch (error) {
			logger.error("Get all users error:", error);
			throw error;
		}
	}
}
