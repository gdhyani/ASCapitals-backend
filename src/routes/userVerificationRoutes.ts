import { Router } from "express";
import { UserVerificationController } from "../controllers/userVerificationController";
import { authenticate, requireSuperAdmin } from "../middleware/auth";
import {
	validateObjectId,
	validateQueryParams,
} from "../middleware/validation";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation rules for verification request creation
const validateVerificationRequestCreation = [
	body("firstName")
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("First name must be between 1 and 50 characters"),
	body("lastName")
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("Last name must be between 1 and 50 characters"),
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters"),
	body("phoneNumber")
		.optional()
		.isMobilePhone("en-US")
		.withMessage("Please provide a valid phone number"),
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
	body("rating")
		.optional()
		.isInt({ min: 1, max: 5 })
		.withMessage("Rating must be between 1 and 5"),
	handleValidationErrors,
];

// Validation rules for approval
const validateApproval = [
	body("reviewNotes")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Review notes cannot exceed 1000 characters"),
	handleValidationErrors,
];

// Validation rules for rejection
const validateRejection = [
	body("rejectionReason")
		.trim()
		.isLength({ min: 1, max: 500 })
		.withMessage("Rejection reason must be between 1 and 500 characters"),
	body("reviewNotes")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Review notes cannot exceed 1000 characters"),
	handleValidationErrors,
];

// Validation rules for bulk operations
const validateBulkApproval = [
	body("requestIds")
		.isArray({ min: 1 })
		.withMessage("Request IDs must be a non-empty array"),
	body("requestIds.*")
		.isMongoId()
		.withMessage("Each request ID must be a valid MongoDB ObjectId"),
	body("reviewNotes")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Review notes cannot exceed 1000 characters"),
	handleValidationErrors,
];

const validateBulkRejection = [
	body("requestIds")
		.isArray({ min: 1 })
		.withMessage("Request IDs must be a non-empty array"),
	body("requestIds.*")
		.isMongoId()
		.withMessage("Each request ID must be a valid MongoDB ObjectId"),
	body("rejectionReason")
		.trim()
		.isLength({ min: 1, max: 500 })
		.withMessage("Rejection reason must be between 1 and 500 characters"),
	body("reviewNotes")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Review notes cannot exceed 1000 characters"),
	handleValidationErrors,
];

// Public routes (no authentication required)
router.post(
	"/request",
	validateVerificationRequestCreation,
	UserVerificationController.createVerificationRequest
);

// Protected routes (super admin only)
router.get(
	"/",
	authenticate,
	requireSuperAdmin,
	validateQueryParams,
	UserVerificationController.getAllVerificationRequests
);
router.get(
	"/stats",
	authenticate,
	requireSuperAdmin,
	UserVerificationController.getVerificationStats
);
router.get(
	"/pending",
	authenticate,
	requireSuperAdmin,
	validateQueryParams,
	UserVerificationController.getPendingVerificationRequests
);
router.get(
	"/:id",
	authenticate,
	requireSuperAdmin,
	validateObjectId,
	UserVerificationController.getVerificationRequestById
);
router.get(
	"/user/:userId",
	authenticate,
	requireSuperAdmin,
	validateObjectId,
	UserVerificationController.getVerificationRequestByUserId
);

// Approval/Rejection routes (super admin only)
router.put(
	"/:id/approve",
	authenticate,
	requireSuperAdmin,
	validateApproval,
	UserVerificationController.approveVerificationRequest
);
router.put(
	"/:id/reject",
	authenticate,
	requireSuperAdmin,
	validateRejection,
	UserVerificationController.rejectVerificationRequest
);

// Bulk operations (super admin only)
router.post(
	"/bulk-approve",
	authenticate,
	requireSuperAdmin,
	validateBulkApproval,
	UserVerificationController.bulkApproveVerificationRequests
);
router.post(
	"/bulk-reject",
	authenticate,
	requireSuperAdmin,
	validateBulkRejection,
	UserVerificationController.bulkRejectVerificationRequests
);

export default router;
