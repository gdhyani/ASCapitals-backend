import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
	_id: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	role: "user" | "admin" | "super_admin";
	isActive: boolean;
	isVerified: boolean;
	verificationStatus: "pending" | "approved" | "rejected";
	verifiedBy?: string; // User ID who verified
	verifiedAt?: Date;
	rejectionReason?: string;
	profileImage?: string;
	phoneNumber?: string;
	description?: string;
	position?: string;
	rating?: number; // 1-5 stars
	address?: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please enter a valid email",
			],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false, // Don't include password in queries by default
		},
		firstName: {
			type: String,
			required: [true, "First name is required"],
			trim: true,
			maxlength: [50, "First name cannot exceed 50 characters"],
		},
		lastName: {
			type: String,
			required: [true, "Last name is required"],
			trim: true,
			maxlength: [50, "Last name cannot exceed 50 characters"],
		},
		role: {
			type: String,
			enum: ["user", "admin", "super_admin"],
			default: "user",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		verificationStatus: {
			type: String,
			required: [true, "Verification status is required"],
			enum: {
				values: ["pending", "approved", "rejected"],
				message:
					"Verification status must be one of: pending, approved, rejected",
			},
			default: "pending",
		},
		verifiedBy: {
			type: Types.ObjectId,
			ref: "User",
			default: null,
		},
		verifiedAt: {
			type: Date,
			default: null,
		},
		rejectionReason: {
			type: String,
			trim: true,
			maxlength: [500, "Rejection reason cannot exceed 500 characters"],
		},
		profileImage: {
			type: String,
			default: null,
		},
		phoneNumber: {
			type: String,
			trim: true,
			match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},
		position: {
			type: String,
			trim: true,
			maxlength: [100, "Position cannot exceed 100 characters"],
		},
		rating: {
			type: Number,
			min: [1, "Rating must be at least 1"],
			max: [5, "Rating cannot exceed 5"],
			default: null,
		},
		address: {
			street: {
				type: String,
				trim: true,
			},
			city: {
				type: String,
				trim: true,
			},
			state: {
				type: String,
				trim: true,
			},
			zipCode: {
				type: String,
				trim: true,
			},
			country: {
				type: String,
				trim: true,
				default: "USA",
			},
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
	return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ verifiedBy: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
	// Only hash the password if it has been modified (or is new)
	if (!this.isModified("password")) return next();

	try {
		// Hash password with cost of 12
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error as Error);
	}
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	try {
		return await bcrypt.compare(candidatePassword, this.password);
	} catch (error) {
		throw new Error("Password comparison failed");
	}
};

// Define static methods interface
interface IUserModel extends mongoose.Model<IUser> {
	findByEmail(email: string): mongoose.Query<IUser | null, IUser>;
	findActiveUsers(): mongoose.Query<IUser[], IUser>;
	findPendingUsers(): mongoose.Query<IUser[], IUser>;
	findVerifiedUsers(): mongoose.Query<IUser[], IUser>;
	findRejectedUsers(): mongoose.Query<IUser[], IUser>;
}

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string) {
	return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function () {
	return this.find({ isActive: true });
};

// Static method to find pending users
userSchema.statics.findPendingUsers = function () {
	return this.find({ verificationStatus: "pending" });
};

// Static method to find verified users
userSchema.statics.findVerifiedUsers = function () {
	return this.find({ verificationStatus: "approved", isVerified: true });
};

// Static method to find rejected users
userSchema.statics.findRejectedUsers = function () {
	return this.find({ verificationStatus: "rejected" });
};

export default mongoose.model<IUser, IUserModel>("User", userSchema);
