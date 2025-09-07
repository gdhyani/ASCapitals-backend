import { Router } from "express";
import { LeadController } from "../controllers/leadController";
import {
	authenticate,
	requireAdmin,
	requireSuperAdmin,
} from "../middleware/auth";
import {
	validateObjectId,
	validateQueryParams,
} from "../middleware/validation";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation rules for lead creation
const validateLeadCreation = [
	body("name")
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage("Name must be between 1 and 100 characters"),
	body("phoneNumber")
		.trim()
		.custom((value) => {
			if (!value) {
				throw new Error("Phone number is required");
			}
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
	body("email")
		.optional()
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
	body("message")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Message cannot exceed 1000 characters"),
	body("source")
		.optional()
		.isIn(["landing_page", "contact_form", "referral", "other"])
		.withMessage(
			"Source must be one of: landing_page, contact_form, referral, other"
		),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("Priority must be one of: low, medium, high"),
	body("estimatedBudget.min")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("Minimum budget must be a positive number"),
	body("estimatedBudget.max")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("Maximum budget must be a positive number"),
	body("preferredLocation.city")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("City cannot exceed 100 characters"),
	body("preferredLocation.state")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("State cannot exceed 100 characters"),
	body("preferredLocation.zipCode")
		.optional()
		.trim()
		.isLength({ max: 20 })
		.withMessage("ZIP code cannot exceed 20 characters"),
	body("tags").optional().isArray().withMessage("Tags must be an array"),
	body("propertyInterests")
		.optional()
		.isArray()
		.withMessage("Property interests must be an array"),
	handleValidationErrors,
];

// Validation rules for lead update
const validateLeadUpdate = [
	body("name")
		.optional()
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage("Name must be between 1 and 100 characters"),
	body("phoneNumber")
		.optional()
		.trim()
		.custom((value) => {
			if (!value) return true; // Optional field for updates
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
	body("email")
		.optional()
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
	body("message")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Message cannot exceed 1000 characters"),
	body("status")
		.optional()
		.isIn(["new", "contacted", "qualified", "converted", "closed"])
		.withMessage(
			"Status must be one of: new, contacted, qualified, converted, closed"
		),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("Priority must be one of: low, medium, high"),
	body("notes")
		.optional()
		.trim()
		.isLength({ max: 2000 })
		.withMessage("Notes cannot exceed 2000 characters"),
	body("leadScore")
		.optional()
		.isInt({ min: 0, max: 100 })
		.withMessage("Lead score must be between 0 and 100"),
	body("conversionProbability")
		.optional()
		.isInt({ min: 0, max: 100 })
		.withMessage("Conversion probability must be between 0 and 100"),
	handleValidationErrors,
];

// Validation rules for lead assignment
const validateLeadAssignment = [
	body("assignedTo")
		.isMongoId()
		.withMessage("Assigned user ID must be a valid MongoDB ObjectId"),
	handleValidationErrors,
];

// Validation rules for status update
const validateStatusUpdate = [
	body("status")
		.isIn(["new", "contacted", "qualified", "converted", "closed"])
		.withMessage(
			"Status must be one of: new, contacted, qualified, converted, closed"
		),
	handleValidationErrors,
];

// Validation rules for bulk assignment
const validateBulkAssignment = [
	body("leadIds")
		.isArray({ min: 1 })
		.withMessage("Lead IDs must be a non-empty array"),
	body("leadIds.*")
		.isMongoId()
		.withMessage("Each lead ID must be a valid MongoDB ObjectId"),
	body("assignedTo")
		.isMongoId()
		.withMessage("Assigned user ID must be a valid MongoDB ObjectId"),
	handleValidationErrors,
];

// Public routes (no authentication required)
router.post("/", validateLeadCreation, LeadController.createLead);

// Protected routes (authentication required)
router.get("/", authenticate, validateQueryParams, LeadController.getAllLeads);
router.get("/stats", authenticate, requireAdmin, LeadController.getLeadStats);
router.get(
	"/unassigned",
	authenticate,
	validateQueryParams,
	LeadController.getUnassignedLeads
);
router.get("/:id", authenticate, validateObjectId, LeadController.getLeadById);

// Lead management routes
router.put("/:id", authenticate, validateLeadUpdate, LeadController.updateLead);
router.put(
	"/:id/status",
	authenticate,
	validateStatusUpdate,
	LeadController.updateLeadStatus
);

// Assignment routes (admin/super admin only)
router.put(
	"/:id/assign",
	authenticate,
	requireAdmin,
	validateLeadAssignment,
	LeadController.assignLead
);
router.put(
	"/:id/unassign",
	authenticate,
	requireAdmin,
	LeadController.unassignLead
);
router.post(
	"/bulk-assign",
	authenticate,
	requireSuperAdmin,
	validateBulkAssignment,
	LeadController.bulkAssignLeads
);

// User-specific routes
router.get(
	"/assigned/:userId",
	authenticate,
	validateObjectId,
	validateQueryParams,
	LeadController.getLeadsByAssignedUser
);

export default router;
