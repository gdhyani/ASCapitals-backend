import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILead extends Document {
	_id: string;
	name: string;
	phoneNumber: string;
	email?: string;
	message?: string;
	source: "landing_page" | "contact_form" | "referral" | "other";
	status: "new" | "contacted" | "qualified" | "converted" | "closed";
	priority: "low" | "medium" | "high";
	assignedTo?: string; // User ID
	assignedBy?: string; // User ID who assigned the lead
	assignedAt?: Date;
	lastContactedAt?: Date;
	notes?: string;
	tags?: string[];
	propertyInterests?: string[]; // Property IDs or types they're interested in
	estimatedBudget?: {
		min: number;
		max: number;
	};
	preferredLocation?: {
		city: string;
		state: string;
		zipCode?: string;
	};
	leadScore?: number; // 0-100 score based on various factors
	conversionProbability?: number; // 0-100 probability of conversion
	createdAt: Date;
	updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
	{
		name: {
			type: String,
			required: [true, "Lead name is required"],
			trim: true,
			maxlength: [100, "Name cannot exceed 100 characters"],
		},
		phoneNumber: {
			type: String,
			required: [true, "Phone number is required"],
			trim: true,
			match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please enter a valid email",
			],
		},
		message: {
			type: String,
			trim: true,
			maxlength: [1000, "Message cannot exceed 1000 characters"],
		},
		source: {
			type: String,
			required: [true, "Lead source is required"],
			enum: {
				values: ["landing_page", "contact_form", "referral", "other"],
				message:
					"Source must be one of: landing_page, contact_form, referral, other",
			},
			default: "landing_page",
		},
		status: {
			type: String,
			required: [true, "Lead status is required"],
			enum: {
				values: ["new", "contacted", "qualified", "converted", "closed"],
				message:
					"Status must be one of: new, contacted, qualified, converted, closed",
			},
			default: "new",
		},
		priority: {
			type: String,
			required: [true, "Lead priority is required"],
			enum: {
				values: ["low", "medium", "high"],
				message: "Priority must be one of: low, medium, high",
			},
			default: "medium",
		},
		assignedTo: {
			type: Types.ObjectId,
			ref: "User",
			default: null,
		},
		assignedBy: {
			type: Types.ObjectId,
			ref: "User",
			default: null,
		},
		assignedAt: {
			type: Date,
			default: null,
		},
		lastContactedAt: {
			type: Date,
			default: null,
		},
		notes: {
			type: String,
			trim: true,
			maxlength: [2000, "Notes cannot exceed 2000 characters"],
		},
		tags: [
			{
				type: String,
				trim: true,
				maxlength: [50, "Tag cannot exceed 50 characters"],
			},
		],
		propertyInterests: [
			{
				type: String,
				trim: true,
			},
		],
		estimatedBudget: {
			min: {
				type: Number,
				min: [0, "Minimum budget cannot be negative"],
			},
			max: {
				type: Number,
				min: [0, "Maximum budget cannot be negative"],
			},
		},
		preferredLocation: {
			city: {
				type: String,
				trim: true,
				maxlength: [100, "City cannot exceed 100 characters"],
			},
			state: {
				type: String,
				trim: true,
				maxlength: [100, "State cannot exceed 100 characters"],
			},
			zipCode: {
				type: String,
				trim: true,
				maxlength: [20, "ZIP code cannot exceed 20 characters"],
			},
		},
		leadScore: {
			type: Number,
			min: [0, "Lead score cannot be negative"],
			max: [100, "Lead score cannot exceed 100"],
			default: 0,
		},
		conversionProbability: {
			type: Number,
			min: [0, "Conversion probability cannot be negative"],
			max: [100, "Conversion probability cannot exceed 100"],
			default: 0,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtual for full contact info
leadSchema.virtual("contactInfo").get(function (this: ILead) {
	return `${
		this.name
	} - ${this.phoneNumber}${this.email ? ` (${this.email})` : ""}`;
});

// Virtual for days since creation
leadSchema.virtual("daysSinceCreated").get(function (this: ILead) {
	const now = new Date();
	const created = new Date(this.createdAt);
	const diffTime = Math.abs(now.getTime() - created.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days since last contact
leadSchema.virtual("daysSinceLastContact").get(function (this: ILead) {
	if (!this.lastContactedAt) return null;
	const now = new Date();
	const lastContact = new Date(this.lastContactedAt);
	const diffTime = Math.abs(now.getTime() - lastContact.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ phoneNumber: 1 });
leadSchema.index({ email: 1 });

// Compound indexes
leadSchema.index({ status: 1, priority: 1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ source: 1, status: 1 });

// Static method to find leads by status
leadSchema.statics.findByStatus = function (status: string) {
	return this.find({ status });
};

// Static method to find unassigned leads
leadSchema.statics.findUnassigned = function () {
	return this.find({ assignedTo: null });
};

// Static method to find leads by assigned user
leadSchema.statics.findByAssignedUser = function (userId: string) {
	return this.find({ assignedTo: userId });
};

// Static method to find leads by source
leadSchema.statics.findBySource = function (source: string) {
	return this.find({ source });
};

// Define static methods interface
interface ILeadModel extends mongoose.Model<ILead> {
	findByStatus(status: string): mongoose.Query<ILead[], ILead>;
	findUnassigned(): mongoose.Query<ILead[], ILead>;
	findByAssignedUser(userId: string): mongoose.Query<ILead[], ILead>;
	findBySource(source: string): mongoose.Query<ILead[], ILead>;
}

export default mongoose.model<ILead, ILeadModel>("Lead", leadSchema);
