import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProperty extends Document {
	_id: string;
	title: string;
	description: string;
	price: number;
	location: string;
	propertyType: "apartment" | "house" | "hotel" | "townhouse" | "commercial";
	propertyFor: "sale" | "rent";
	bedrooms: number;
	bathrooms: number;
	squareFeet: number;
	images: string[];
	amenities: string[];
	status: "available" | "sold" | "rented" | "pending";
	owner?: {
		_id?: mongoose.Schema.Types.ObjectId;
		name?: string;
		email?: string;
		phone?: string;
		address?: string;
	};
	agent: mongoose.Schema.Types.ObjectId; // User ID
	approvalStatus: "pending" | "approved" | "rejected";
	approvedBy?: mongoose.Schema.Types.ObjectId; // Super admin who approved/rejected
	approvedAt?: Date;
	rejectionReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
	{
		title: {
			type: String,
			required: [true, "Property title is required"],
			trim: true,
			maxlength: [200, "Title cannot exceed 200 characters"],
		},
		description: {
			type: String,
			required: [true, "Property description is required"],
			trim: true,
			maxlength: [2000, "Description cannot exceed 2000 characters"],
		},
		price: {
			type: Number,
			required: [true, "Property price is required"],
			min: [0, "Price cannot be negative"],
		},
		location: {
			type: String,
			required: [true, "Location is required"],
			maxlength: [200, "Location cannot exceed 200 characters"],
		},
		propertyType: {
			type: String,
			required: [true, "Property type is required"],
			enum: {
				values: ["apartment", "house", "hotel", "townhouse", "commercial"],
				message:
					"Property type must be one of: apartment, house, hotel, townhouse, commercial",
			},
		},
		propertyFor: {
			type: String,
			required: [true, "Property for is required"],
			enum: {
				values: ["sale", "rent"],
				message: "Property for must be one of: sale, rent",
			},
		},
		bedrooms: {
			type: Number,
			required: [true, "Number of bedrooms is required"],
			min: [0, "Bedrooms cannot be negative"],
			max: [20, "Bedrooms cannot exceed 20"],
		},
		bathrooms: {
			type: Number,
			required: [true, "Number of bathrooms is required"],
			min: [0, "Bathrooms cannot be negative"],
			max: [20, "Bathrooms cannot exceed 20"],
		},
		squareFeet: {
			type: Number,
			required: [true, "Square footage is required"],
			min: [0, "Square footage cannot be negative"],
		},
		images: [
			{
				type: String,
			},
		],
		amenities: [
			{
				type: String,
				trim: true,
			},
		],
		status: {
			type: String,
			required: [true, "Property status is required"],
			enum: {
				values: ["available", "sold", "rented", "pending"],
				message: "Status must be one of: available, sold, rented, pending",
			},
			default: "available",
		},
		owner: {
			type: {
				_id: {
					type: mongoose.Schema.Types.ObjectId,
					auto: true,
					required: false,
				},
				name: { type: String, required: false },
				email: { type: String, required: false },
				phone: { type: String, required: false },
				address: { type: String, required: false },
			},
			required: false,
		},
		agent: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		approvalStatus: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
		approvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		approvedAt: {
			type: Date,
			required: false,
		},
		rejectionReason: {
			type: String,
			required: false,
			maxlength: [500, "Rejection reason cannot exceed 500 characters"],
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtual for price per square foot
propertySchema.virtual("pricePerSqFt").get(function (this: IProperty) {
	return this.squareFeet > 0 ? Math.round(this.price / this.squareFeet) : 0;
});

// Indexes for better query performance
propertySchema.index({ title: "text", description: "text" }); // Text search
propertySchema.index({ price: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ bathrooms: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ agent: 1 });
propertySchema.index({ approvalStatus: 1 });
propertySchema.index({ createdAt: -1 });

// Static method to find properties by location
propertySchema.statics.findByLocation = function (location: string) {
	const query: any = { location: new RegExp(location, "i") };
	if (location) {
		query["location"] = new RegExp(location, "i");
	}
	return this.find(query);
};

// Static method to find properties by price range
propertySchema.statics.findByPriceRange = function (
	minPrice: number,
	maxPrice: number
) {
	return this.find({
		price: {
			$gte: minPrice,
			$lte: maxPrice,
		},
	});
};

// Static method to find available properties
propertySchema.statics.findAvailable = function () {
	return this.find({ status: "available" });
};

export default mongoose.model<IProperty>("Property", propertySchema);
