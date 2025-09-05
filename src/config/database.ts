import mongoose from "mongoose";
import { logger } from "./logger";

const connectDB = async (): Promise<void> => {
	try {
		const mongoURI =
			process.env.MONGODB_URI || "mongodb://localhost:27017/as-capitals";

		const conn = await mongoose.connect(mongoURI, {
			// Remove deprecated options for newer versions
		});

		logger.info(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		logger.error("Database connection error:", error);
		process.exit(1);
	}
};

// Handle connection events
mongoose.connection.on("connected", () => {
	logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
	logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
	logger.warn("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
	await mongoose.connection.close();
	logger.info("MongoDB connection closed through app termination");
	process.exit(0);
});

export default connectDB;
