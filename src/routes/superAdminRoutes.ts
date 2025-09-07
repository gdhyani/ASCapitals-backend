import { Router } from "express";
import { SuperAdminController } from "../controllers/superAdminController";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validation";
import { resetRateLimits } from "../middleware/rateLimiter";

const router = Router();

// Validation rules for super admin creation
const validateSuperAdminCreation = [
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters"),
	body("firstName")
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("First name must be between 1 and 50 characters"),
	body("lastName")
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("Last name must be between 1 and 50 characters"),
	body("phoneNumber")
		.optional()
		.custom((value) => {
			if (!value) return true; // Optional field
			// Remove all non-digit characters
			const cleaned = value.replace(/\D/g, "");
			// Check if it's a valid 10-digit US number or international format
			if (
				cleaned.length === 10 ||
				(cleaned.length >= 10 && cleaned.length <= 15)
			) {
				return true;
			}
			throw new Error("Please provide a valid phone number");
		}),
	body("description")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Description cannot exceed 1000 characters"),
	body("position")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("Position cannot exceed 100 characters"),
	handleValidationErrors,
];

// Development-only routes for super admin management
router.post(
	"/create",
	validateSuperAdminCreation,
	SuperAdminController.createSuperAdmin
);

router.get("/", SuperAdminController.getAllSuperAdmins);

// Development-only endpoint to reset rate limits
router.post("/reset-rate-limits", (req, res) => {
	if (process.env.NODE_ENV === "development") {
		resetRateLimits();
		res.json({
			success: true,
			message: "Rate limits reset successfully for development",
		});
	} else {
		res.status(403).json({
			success: false,
			message: "This endpoint is only available in development mode",
		});
	}
});

export default router;
