import { Request } from "express";
import { IUser } from "../models/User";
import { IProperty } from "../models/Property";
import { ILead } from "../models/Lead";
import { IUserVerificationRequest } from "../models/UserVerificationRequest";

export interface IAuthRequest extends Request {
	user?: IUser;
}

export interface IJWTPayload {
	userId: string;
	email: string;
	role: string;
	iat?: number;
	exp?: number;
}

export interface IFileUpload {
	fieldname: string;
	originalname: string;
	encoding: string;
	mimetype: string;
	size: number;
	buffer: Buffer;
}

export interface IS3UploadResult {
	Location: string;
	Key: string;
	Bucket: string;
}

export interface IApiResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
}

export interface IQueryParams {
	page?: number;
	limit?: number;
	sort?: string;
	search?: string;
	filter?: Record<string, any>;
}
