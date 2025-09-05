import rateLimit from "express-rate-limit";
import { logger } from "../config/logger";

// General rate limiter
export const generalLimiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
	max:
		process.env.NODE_ENV === "development"
			? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000") // More lenient in development
			: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // Production limit
	message: {
		success: false,
		message: "Too many requests from this IP, please try again later.",
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	handler: (req, res) => {
		logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({
			success: false,
			message: "Too many requests from this IP, please try again later.",
		});
	},
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === "development" ? 50 : 5, // More lenient in development
	message: {
		success: false,
		message: "Too many authentication attempts, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({
			success: false,
			message: "Too many authentication attempts, please try again later.",
		});
	},
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 50, // Limit each IP to 50 upload requests per hour
	message: {
		success: false,
		message: "Too many file uploads, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({
			success: false,
			message: "Too many file uploads, please try again later.",
		});
	},
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 3, // Limit each IP to 3 password reset requests per hour
	message: {
		success: false,
		message: "Too many password reset attempts, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({
			success: false,
			message: "Too many password reset attempts, please try again later.",
		});
	},
});

// Development helper to reset rate limits
export const resetRateLimits = () => {
	if (process.env.NODE_ENV === "development") {
		generalLimiter.resetKey("*");
		authLimiter.resetKey("*");
		uploadLimiter.resetKey("*");
		passwordResetLimiter.resetKey("*");
		logger.info("Rate limits reset for development");
	}
};
