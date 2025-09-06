import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { logger } from "../config/logger";

// Handle validation errors
export const handleValidationErrors = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const errorMessages = errors.array().map((error) => ({
			field: error.type === "field" ? (error as any).path : "unknown",
			message: error.msg,
			value: error.type === "field" ? (error as any).value : undefined,
		}));

		logger.warn("Validation errors:", errorMessages);

		res.status(400).json({
			success: false,
			message: "Validation failed",
			errors: errorMessages,
		});
		return;
	}

	next();
};

// User validation rules
export const validateUserRegistration = [
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			"Password must contain at least one lowercase letter, one uppercase letter, and one number"
		),
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

export const validateUserLogin = [
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
	body("password").notEmpty().withMessage("Password is required"),
	handleValidationErrors,
];

export const validateUserUpdate = [
	body("firstName")
		.optional()
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("First name must be between 1 and 50 characters"),
	body("lastName")
		.optional()
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("Last name must be between 1 and 50 characters"),
	body("phoneNumber")
		.optional()
		.isMobilePhone("en-US")
		.withMessage("Please provide a valid phone number"),
	body("address.street")
		.optional()
		.trim()
		.isLength({ max: 200 })
		.withMessage("Street address cannot exceed 200 characters"),
	body("address.city")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("City cannot exceed 100 characters"),
	body("address.state")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("State cannot exceed 100 characters"),
	body("address.zipCode")
		.optional()
		.trim()
		.isLength({ max: 20 })
		.withMessage("ZIP code cannot exceed 20 characters"),
	body("address.country")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("Country cannot exceed 100 characters"),
	handleValidationErrors,
];

// Property validation rules
export const validatePropertyCreation = [
	body("title")
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title must be between 1 and 200 characters"),
	body("description")
		.trim()
		.isLength({ min: 1, max: 2000 })
		.withMessage("Description must be between 1 and 2000 characters"),
	body("price")
		.isFloat({ min: 0 })
		.withMessage("Price must be a positive number"),
	body("location")
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Location must be between 1 and 200 characters"),
	body("propertyType")
		.isIn(["apartment", "house", "hotel", "townhouse", "commercial"])
		.withMessage(
			"Property type must be one of: apartment, house, hotel, townhouse, commercial"
		),
	body("propertyFor")
		.isIn(["sale", "rent"])
		.withMessage("Property for must be either 'sale' or 'rent'"),
	body("bedrooms")
		.isInt({ min: 0, max: 20 })
		.withMessage("Bedrooms must be between 0 and 20"),
	body("bathrooms")
		.isFloat({ min: 0, max: 20 })
		.withMessage("Bathrooms must be between 0 and 20"),
	body("squareFeet")
		.isInt({ min: 0 })
		.withMessage("Square footage must be a positive number"),
	body("amenities")
		.optional()
		.isArray()
		.withMessage("Amenities must be an array"),
	body("owner.name")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("Owner name cannot exceed 100 characters"),
	body("owner.email")
		.optional()
		.isEmail()
		.withMessage("Owner email must be valid"),
	body("owner.phone")
		.optional()
		.trim()
		.isLength({ max: 20 })
		.withMessage("Owner phone cannot exceed 20 characters"),
	body("owner.address")
		.optional()
		.trim()
		.isLength({ max: 200 })
		.withMessage("Owner address cannot exceed 200 characters"),
	handleValidationErrors,
];

export const validatePropertyUpdate = [
	body("title")
		.optional()
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title must be between 1 and 200 characters"),
	body("description")
		.optional()
		.trim()
		.isLength({ min: 1, max: 2000 })
		.withMessage("Description must be between 1 and 2000 characters"),
	body("price")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("Price must be a positive number"),
	body("propertyType")
		.optional()
		.isIn(["apartment", "house", "hotel", "townhouse", "commercial"])
		.withMessage(
			"Property type must be one of: apartment, house, hotel, townhouse, commercial"
		),
	body("propertyFor")
		.optional()
		.isIn(["sale", "rent"])
		.withMessage("Property for must be either 'sale' or 'rent'"),
	body("bedrooms")
		.optional()
		.isInt({ min: 0, max: 20 })
		.withMessage("Bedrooms must be between 0 and 20"),
	body("bathrooms")
		.optional()
		.isFloat({ min: 0, max: 20 })
		.withMessage("Bathrooms must be between 0 and 20"),
	body("squareFeet")
		.optional()
		.isInt({ min: 0 })
		.withMessage("Square footage must be a positive number"),
	body("status")
		.optional()
		.isIn(["available", "sold", "rented", "pending"])
		.withMessage("Status must be one of: available, sold, rented, pending"),
	body("amenities")
		.optional()
		.isArray()
		.withMessage("Amenities must be an array"),
	handleValidationErrors,
];

// Parameter validation
export const validateObjectId = [
	param("id").isMongoId().withMessage("Invalid ID format"),
	handleValidationErrors,
];

// Query validation
export const validateQueryParams = [
	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),
	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),
	query("sort")
		.optional()
		.isIn(["createdAt", "-createdAt", "price", "-price", "title", "-title"])
		.withMessage("Invalid sort parameter"),
	handleValidationErrors,
];
