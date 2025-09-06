import { Router } from "express";
import { PropertyController } from "../controllers/propertyController";
import {
	authenticate,
	requireAdmin,
	requireSuperAdmin,
	requireOwnershipOrAdmin,
	optionalAuth,
} from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadMultiple, uploadSingle } from "../middleware/upload";
import {
	validatePropertyCreation,
	validatePropertyUpdate,
	validateObjectId,
	validateQueryParams,
} from "../middleware/validation";

const router = Router();

// Public routes (no authentication required)
router.get("/", optionalAuth, validateQueryParams, PropertyController.getAllProperties);
router.get(
	"/stats",
	authenticate,
	requireAdmin,
	PropertyController.getPropertyStats
);

// Protected routes (authentication required)
router.post(
	"/",
	authenticate,
	validatePropertyCreation,
	PropertyController.createProperty
);
router.get("/:id", validateObjectId, PropertyController.getPropertyById);
router.put(
	"/:id",
	authenticate,
	validatePropertyUpdate,
	PropertyController.updateProperty
);
router.delete("/:id", authenticate, PropertyController.deleteProperty);

// Property images routes
router.post(
	"/:id/images",
	authenticate,
	uploadLimiter,
	uploadMultiple("files", 10),
	PropertyController.uploadPropertyImages
);
router.delete(
	"/:id/images",
	authenticate,
	PropertyController.deletePropertyImage
);

// Owner and agent specific routes
router.get(
	"/owner/:ownerId",
	validateObjectId,
	validateQueryParams,
	PropertyController.getPropertiesByOwner
);
router.get(
	"/agent/:agentId",
	validateObjectId,
	validateQueryParams,
	PropertyController.getPropertiesByAgent
);

// Property approval routes (Super Admin only)
router.get(
	"/approval/pending",
	authenticate,
	requireSuperAdmin,
	validateQueryParams,
	PropertyController.getPendingProperties
);
router.put(
	"/:id/approve",
	authenticate,
	requireSuperAdmin,
	validateObjectId,
	PropertyController.approveProperty
);
router.put(
	"/:id/reject",
	authenticate,
	requireSuperAdmin,
	validateObjectId,
	PropertyController.rejectProperty
);
router.post(
	"/approval/bulk-approve",
	authenticate,
	requireSuperAdmin,
	PropertyController.bulkApproveProperties
);
router.post(
	"/approval/bulk-reject",
	authenticate,
	requireSuperAdmin,
	PropertyController.bulkRejectProperties
);

export default router;
