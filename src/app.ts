import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

// Import configurations
import connectDB from "./config/database";
import { logger, morganStream } from "./config/logger";

// Import middleware
import { generalLimiter } from "./middleware/rateLimiter";
import { globalErrorHandler, handleNotFound } from "./middleware/errorHandler";

// Import routes
import authRoutes from "./routes/authRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import fileRoutes from "./routes/fileRoutes";
import leadRoutes from "./routes/leadRoutes";
import userVerificationRoutes from "./routes/userVerificationRoutes";
import superAdminRoutes from "./routes/superAdminRoutes";

// Create Express app
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
		credentials: true,
	})
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
} else {
	app.use(morgan("combined", { stream: morganStream }));
}

// Rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV,
	});
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/user-verification", userVerificationRoutes);
app.use("/api/super-admin", superAdminRoutes);

// Root endpoint
app.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "AS Capitals Backend API",
		version: "1.0.0",
		documentation: "/api/docs",
	});
});

// Handle 404 routes
app.use(handleNotFound);

// Global error handling middleware
app.use(globalErrorHandler);

export default app;
