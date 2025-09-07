import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserVerificationRequest extends Document {
	_id: string;
	userId: Types.ObjectId; // Reference to the user who requested verification
	requestedAt: Date;
	status: "pending" | "approved" | "rejected";
	reviewedBy?: Types.ObjectId; // User ID who reviewed the request
	reviewedAt?: Date;
	reviewNotes?: string;
	rejectionReason?: string;
	userDetails: {
		firstName: string;
		lastName: string;
		email: string;
		phoneNumber?: string;
		description?: string;
		position?: string;
		rating?: number;
		profileImage?: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

const userVerificationRequestSchema = new Schema<IUserVerificationRequest>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [true, "User ID is required"],
		},
		requestedAt: {
			type: Date,
			default: Date.now,
		},
		status: {
			type: String,
			required: [true, "Request status is required"],
			enum: {
				values: ["pending", "approved", "rejected"],
				message: "Status must be one of: pending, approved, rejected",
			},
			default: "pending",
		},
		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		reviewedAt: {
			type: Date,
			default: null,
		},
		reviewNotes: {
			type: String,
			trim: true,
			maxlength: [1000, "Review notes cannot exceed 1000 characters"],
		},
		rejectionReason: {
			type: String,
			trim: true,
			maxlength: [500, "Rejection reason cannot exceed 500 characters"],
		},
		userDetails: {
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
			email: {
				type: String,
				required: [true, "Email is required"],
				lowercase: true,
				trim: true,
				match: [
					/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
					"Please enter a valid email",
				],
			},
			phoneNumber: {
				type: String,
				trim: true,
				validate: {
					validator: function (value: string) {
						if (!value) return true; // Optional field
						// Remove all non-digit characters
						const cleaned = value.replace(/\D/g, "");
						// Check if it's a valid 10-digit US number or international format
						return cleaned.length >= 10 && cleaned.length <= 15;
					},
					message: "Please enter a valid phone number",
				},
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
			},
			profileImage: {
				type: String,
				default: null,
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
userVerificationRequestSchema
	.virtual("userDetails.fullName")
	.get(function (this: IUserVerificationRequest) {
		return `${this.userDetails.firstName} ${this.userDetails.lastName}`;
	});

// Virtual for days since request
userVerificationRequestSchema
	.virtual("daysSinceRequest")
	.get(function (this: IUserVerificationRequest) {
		const now = new Date();
		const requested = new Date(this.requestedAt);
		const diffTime = Math.abs(now.getTime() - requested.getTime());
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	});

// Indexes for better query performance
userVerificationRequestSchema.index({ userId: 1 });
userVerificationRequestSchema.index({ status: 1 });
userVerificationRequestSchema.index({ requestedAt: -1 });
userVerificationRequestSchema.index({ reviewedBy: 1 });
userVerificationRequestSchema.index({ "userDetails.email": 1 });

// Compound indexes
userVerificationRequestSchema.index({ status: 1, requestedAt: -1 });
userVerificationRequestSchema.index({ userId: 1, status: 1 });

// Define static methods interface
interface IUserVerificationRequestModel
	extends mongoose.Model<IUserVerificationRequest> {
	findPendingRequests(): mongoose.Query<
		IUserVerificationRequest[],
		IUserVerificationRequest
	>;
	findApprovedRequests(): mongoose.Query<
		IUserVerificationRequest[],
		IUserVerificationRequest
	>;
	findRejectedRequests(): mongoose.Query<
		IUserVerificationRequest[],
		IUserVerificationRequest
	>;
	findByUserId(
		userId: string
	): mongoose.Query<IUserVerificationRequest | null, IUserVerificationRequest>;
}

// Static method to find pending requests
userVerificationRequestSchema.statics.findPendingRequests = function () {
	return this.find({ status: "pending" })
		.populate("userId", "firstName lastName email")
		.populate("reviewedBy", "firstName lastName email")
		.sort({ requestedAt: -1 });
};

// Static method to find approved requests
userVerificationRequestSchema.statics.findApprovedRequests = function () {
	return this.find({ status: "approved" })
		.populate("userId", "firstName lastName email")
		.populate("reviewedBy", "firstName lastName email")
		.sort({ reviewedAt: -1 });
};

// Static method to find rejected requests
userVerificationRequestSchema.statics.findRejectedRequests = function () {
	return this.find({ status: "rejected" })
		.populate("userId", "firstName lastName email")
		.populate("reviewedBy", "firstName lastName email")
		.sort({ reviewedAt: -1 });
};

// Static method to find request by user ID
userVerificationRequestSchema.statics.findByUserId = function (userId: string) {
	return this.findOne({ userId }).populate(
		"reviewedBy",
		"firstName lastName email"
	);
};

export default mongoose.model<
	IUserVerificationRequest,
	IUserVerificationRequestModel
>("UserVerificationRequest", userVerificationRequestSchema);
