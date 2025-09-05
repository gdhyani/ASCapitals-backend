import app from "./app";
import { logger } from "./config/logger";
import {
	handleUncaughtException,
	handleUnhandledRejection,
} from "./middleware/errorHandler";

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Start server
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
	logger.info(
		`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
	);
	logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
	logger.info(`🔗 API base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	logger.info("SIGTERM received. Shutting down gracefully...");
	server.close(() => {
		logger.info("Process terminated");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	logger.info("SIGINT received. Shutting down gracefully...");
	server.close(() => {
		logger.info("Process terminated");
		process.exit(0);
	});
});

export default server;
