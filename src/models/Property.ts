import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProperty extends Document {
	_id: string;
	title: string;
	description: string;
	price: number;
	location: {
		address: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
		coordinates?: {
			lat: number;
			lng: number;
		};
	};
	propertyType: "apartment" | "house" | "condo" | "townhouse" | "commercial";
	bedrooms: number;
	bathrooms: number;
	squareFeet: number;
	images: string[];
	features: string[];
	status: "available" | "sold" | "rented" | "pending";
	owner: string; // User ID
	agent?: string; // User ID
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
			address: {
				type: String,
				required: [true, "Address is required"],
				trim: true,
			},
			city: {
				type: String,
				required: [true, "City is required"],
				trim: true,
			},
			state: {
				type: String,
				required: [true, "State is required"],
				trim: true,
			},
			zipCode: {
				type: String,
				required: [true, "ZIP code is required"],
				trim: true,
			},
			country: {
				type: String,
				required: [true, "Country is required"],
				trim: true,
				default: "USA",
			},
			coordinates: {
				lat: {
					type: Number,
					min: [-90, "Latitude must be between -90 and 90"],
					max: [90, "Latitude must be between -90 and 90"],
				},
				lng: {
					type: Number,
					min: [-180, "Longitude must be between -180 and 180"],
					max: [180, "Longitude must be between -180 and 180"],
				},
			},
		},
		propertyType: {
			type: String,
			required: [true, "Property type is required"],
			enum: {
				values: ["apartment", "house", "condo", "townhouse", "commercial"],
				message:
					"Property type must be one of: apartment, house, condo, townhouse, commercial",
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
				validate: {
					validator: function (v: string[]) {
						return v.length <= 20; // Maximum 20 images
					},
					message: "Cannot have more than 20 images",
				},
			},
		],
		features: [
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
			type: String,
			required: [true, "Property owner is required"],
		},
		agent: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtual for full address
propertySchema.virtual("fullAddress").get(function (this: IProperty) {
	return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}, ${this.location.country}`;
});

// Virtual for price per square foot
propertySchema.virtual("pricePerSqFt").get(function (this: IProperty) {
	return this.squareFeet > 0 ? Math.round(this.price / this.squareFeet) : 0;
});

// Indexes for better query performance
propertySchema.index({ title: "text", description: "text" }); // Text search
propertySchema.index({ "location.city": 1 });
propertySchema.index({ "location.state": 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ bathrooms: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ agent: 1 });
propertySchema.index({ createdAt: -1 });

// Static method to find properties by location
propertySchema.statics.findByLocation = function (
	city: string,
	state?: string
) {
	const query: any = { "location.city": new RegExp(city, "i") };
	if (state) {
		query["location.state"] = new RegExp(state, "i");
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
