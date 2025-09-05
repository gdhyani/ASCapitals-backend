import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { IAuthRequest, IJWTPayload } from "../types";
import { logger } from "../config/logger";

// Extend Request interface to include user
declare global {
	namespace Express {
		interface Request {
			user?: IUser;
		}
	}
}

// Verify JWT token
export const authenticate = async (
	req: IAuthRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");

		if (!token) {
			res.status(401).json({
				success: false,
				message: "Access denied. No token provided.",
			});
			return;
		}

		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET as string
		) as IJWTPayload;

		// Find user by ID from token
		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			res.status(401).json({
				success: false,
				message: "Invalid token. User not found.",
			});
			return;
		}

		if (!user.isActive) {
			res.status(401).json({
				success: false,
				message: "Account is deactivated.",
			});
			return;
		}

		req.user = user;
		next();
	} catch (error) {
		logger.error("Authentication error:", error);

		if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({
				success: false,
				message: "Invalid token.",
			});
			return;
		}

		res.status(500).json({
			success: false,
			message: "Authentication failed.",
		});
	}
};

// Check if user has required role
export const authorize = (...roles: string[]) => {
	return (req: IAuthRequest, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: "Authentication required.",
			});
			return;
		}

		if (!roles.includes(req.user.role)) {
			res.status(403).json({
				success: false,
				message: `Access denied. Required role: ${roles.join(" or ")}`,
			});
			return;
		}

		next();
	};
};

// Check if user is admin or super admin
export const requireAdmin = authorize("admin", "super_admin");

// Check if user is super admin only
export const requireSuperAdmin = authorize("super_admin");

// Check if user owns resource or is admin
export const requireOwnershipOrAdmin = (
	resourceUserIdField: string = "owner"
) => {
	return (req: IAuthRequest, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: "Authentication required.",
			});
			return;
		}

		const resourceUserId =
			req.params[resourceUserIdField] || req.body[resourceUserIdField];
		const isOwner = req.user._id.toString() === resourceUserId;
		const isAdmin = ["admin", "super_admin"].includes(req.user.role);

		if (!isOwner && !isAdmin) {
			res.status(403).json({
				success: false,
				message: "Access denied. You can only access your own resources.",
			});
			return;
		}

		next();
	};
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
	req: IAuthRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");

		if (token) {
			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET as string
			) as IJWTPayload;
			const user = await User.findById(decoded.userId).select("-password");

			if (user && user.isActive) {
				req.user = user;
			}
		}

		next();
	} catch (error) {
		// Continue without authentication
		next();
	}
};
