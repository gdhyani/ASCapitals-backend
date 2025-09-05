import { Types } from "mongoose";

// Check if string is valid MongoDB ObjectId
export const isValidObjectId = (id: string): boolean => {
	return Types.ObjectId.isValid(id);
};

// Generate random string
export const generateRandomString = (length: number = 8): string => {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

// Format phone number
export const formatPhoneNumber = (phoneNumber: string): string => {
	// Remove all non-digit characters
	const cleaned = phoneNumber.replace(/\D/g, "");

	// Format as (XXX) XXX-XXXX for US numbers
	if (cleaned.length === 10) {
		return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
			6
		)}`;
	}

	return phoneNumber; // Return original if not 10 digits
};

// Format currency
export const formatCurrency = (
	amount: number,
	currency: string = "USD"
): string => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
	}).format(amount);
};

// Format date
export const formatDate = (
	date: Date | string,
	format: "short" | "long" | "time" = "short"
): string => {
	const d = new Date(date);

	switch (format) {
		case "short":
			return d.toLocaleDateString("en-US");
		case "long":
			return d.toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		case "time":
			return d.toLocaleString("en-US");
		default:
			return d.toLocaleDateString("en-US");
	}
};

// Calculate pagination
export const calculatePagination = (
	page: number,
	limit: number,
	total: number
) => {
	const pages = Math.ceil(total / limit);
	const hasNext = page < pages;
	const hasPrev = page > 1;

	return {
		page,
		limit,
		total,
		pages,
		hasNext,
		hasPrev,
		nextPage: hasNext ? page + 1 : null,
		prevPage: hasPrev ? page - 1 : null,
	};
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
	return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
};

// Generate slug from string
export const generateSlug = (text: string): string => {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "") // Remove special characters
		.replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// Validate phone number format
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
	const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
	return phoneRegex.test(phoneNumber.replace(/\D/g, ""));
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj));
};

// Remove undefined values from object
export const removeUndefined = (
	obj: Record<string, any>
): Record<string, any> => {
	const cleaned: Record<string, any> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined) {
			cleaned[key] = value;
		}
	}

	return cleaned;
};

// Convert string to title case
export const toTitleCase = (str: string): string => {
	return str.replace(/\w\S*/g, (txt) => {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

// Generate random color
export const generateRandomColor = (): string => {
	const colors = [
		"#FF6B6B",
		"#4ECDC4",
		"#45B7D1",
		"#96CEB4",
		"#FFEAA7",
		"#DDA0DD",
		"#98D8C8",
		"#F7DC6F",
		"#BB8FCE",
		"#85C1E9",
	];
	return colors[Math.floor(Math.random() * colors.length)];
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
	func: T,
	wait: number
): ((...args: Parameters<T>) => void) => {
	let timeout: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
	func: T,
	limit: number
): ((...args: Parameters<T>) => void) => {
	let inThrottle: boolean;

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
};
