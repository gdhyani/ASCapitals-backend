// User roles
export const USER_ROLES = {
	USER: "user",
	ADMIN: "admin",
	SUPER_ADMIN: "super_admin",
} as const;

// Property types
export const PROPERTY_TYPES = {
	APARTMENT: "apartment",
	HOUSE: "house",
	CONDO: "condo",
	TOWNHOUSE: "townhouse",
	COMMERCIAL: "commercial",
} as const;

// Property status
export const PROPERTY_STATUS = {
	AVAILABLE: "available",
	SOLD: "sold",
	RENTED: "rented",
	PENDING: "pending",
} as const;

// HTTP status codes
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
} as const;

// File upload limits
export const FILE_LIMITS = {
	MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
	MAX_FILES_PER_REQUEST: 10,
	ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif"],
	ALLOWED_DOCUMENT_TYPES: ["application/pdf"],
} as const;

// Pagination defaults
export const PAGINATION = {
	DEFAULT_PAGE: 1,
	DEFAULT_LIMIT: 10,
	MAX_LIMIT: 100,
} as const;

// JWT token types
export const TOKEN_TYPES = {
	ACCESS: "access",
	REFRESH: "refresh",
} as const;

// Database collections
export const COLLECTIONS = {
	USERS: "users",
	PROPERTIES: "properties",
} as const;

// API response messages
export const MESSAGES = {
	SUCCESS: {
		USER_REGISTERED: "User registered successfully",
		USER_LOGGED_IN: "Login successful",
		PROFILE_UPDATED: "Profile updated successfully",
		PASSWORD_CHANGED: "Password changed successfully",
		PROPERTY_CREATED: "Property created successfully",
		PROPERTY_UPDATED: "Property updated successfully",
		PROPERTY_DELETED: "Property deleted successfully",
		FILE_UPLOADED: "File uploaded successfully",
		FILE_DELETED: "File deleted successfully",
	},
	ERROR: {
		INVALID_CREDENTIALS: "Invalid email or password",
		USER_NOT_FOUND: "User not found",
		PROPERTY_NOT_FOUND: "Property not found",
		UNAUTHORIZED: "Access denied",
		VALIDATION_FAILED: "Validation failed",
		FILE_TOO_LARGE: "File size too large",
		INVALID_FILE_TYPE: "Invalid file type",
		SERVER_ERROR: "Internal server error",
	},
} as const;
