import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { IApiResponse } from "../types";

// Custom error class
export class AppError extends Error {
	public statusCode: number;
	public isOperational: boolean;

	constructor(
		message: string,
		statusCode: number = 500,
		isOperational: boolean = true
	) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Error.captureStackTrace(this, this.constructor);
	}
}

// Handle MongoDB duplicate key error
const handleDuplicateKeyError = (err: any): AppError => {
	const field = Object.keys(err.keyValue)[0];
	const value = err.keyValue[field];
	const message = `${field} '${value}' already exists`;
	return new AppError(message, 400);
};

// Handle MongoDB validation error
const handleValidationError = (err: any): AppError => {
	const errors = Object.values(err.errors).map((val: any) => val.message);
	const message = `Invalid input data: ${errors.join(". ")}`;
	return new AppError(message, 400);
};

// Handle MongoDB cast error
const handleCastError = (err: any): AppError => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = (): AppError => {
	return new AppError("Invalid token. Please log in again!", 401);
};

const handleJWTExpiredError = (): AppError => {
	return new AppError("Your token has expired! Please log in again.", 401);
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
	const response: IApiResponse = {
		success: false,
		message: err.message,
		error: err.stack,
	};

	res.status(err.statusCode).json(response);
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
	// Operational, trusted error: send message to client
	if (err.isOperational) {
		const response: IApiResponse = {
			success: false,
			message: err.message,
		};

		res.status(err.statusCode).json(response);
	} else {
		// Programming or other unknown error: don't leak error details
		logger.error("ERROR 💥", err);

		const response: IApiResponse = {
			success: false,
			message: "Something went wrong!",
		};

		res.status(500).json(response);
	}
};

// Global error handling middleware
export const globalErrorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || "error";

	if (process.env.NODE_ENV === "development") {
		sendErrorDev(err, res);
	} else {
		let error = { ...err };
		error.message = err.message;

		// Handle specific error types
		if (error.code === 11000) error = handleDuplicateKeyError(error);
		if (error.name === "ValidationError") error = handleValidationError(error);
		if (error.name === "CastError") error = handleCastError(error);
		if (error.name === "JsonWebTokenError") error = handleJWTError();
		if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

		sendErrorProd(error, res);
	}
};

// Handle unhandled routes
export const handleNotFound = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const response: IApiResponse = {
		success: false,
		message: `Route ${req.originalUrl} not found`,
	};

	res.status(404).json(response);
};

// Handle uncaught exceptions
export const handleUncaughtException = (): void => {
	process.on("uncaughtException", (err: Error) => {
		logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
		logger.error(err.name, err.message);
		process.exit(1);
	});
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (): void => {
	process.on("unhandledRejection", (err: Error) => {
		logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
		logger.error(err.name, err.message);
		process.exit(1);
	});
};
