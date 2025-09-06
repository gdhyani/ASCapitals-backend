import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import {
	validateUserRegistration,
	validateUserLogin,
	validateUserUpdate,
	validateObjectId,
	validateQueryParams,
} from "../middleware/validation";

const router = Router();

// Public routes
router.post(
	"/register",
	authLimiter,
	validateUserRegistration,
	AuthController.register
);
router.post("/login", authLimiter, validateUserLogin, AuthController.login);

// Protected routes
router.get("/profile", authenticate, AuthController.getProfile);
router.put(
	"/profile",
	authenticate,
	validateUserUpdate,
	AuthController.updateProfile
);
router.put("/change-password", authenticate, AuthController.changePassword);
router.put("/deactivate", authenticate, AuthController.deactivateAccount);

// Admin routes
router.get(
	"/users",
	authenticate,
	requireAdmin,
	validateQueryParams,
	AuthController.getAllUsers
);
router.get(
	"/users/:id",
	authenticate,
	requireAdmin,
	validateObjectId,
	AuthController.getUserById
);

export default router;
