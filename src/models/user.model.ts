import { Document, model, Schema } from 'mongoose';
import { roles, status, UserInfo } from 'cooklens-types';

export interface SigninForm {
	username: string;
	password: string;
}

export interface SignupForm extends SigninForm {
	email: string;
}

export type IUser = Omit<UserInfo, '_id'>;

const UserSchema = new Schema<IUser>({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	role: {
		type: String,
		enum: roles,
		default: 'user',
	},
	status: {
		type: String,
		enum: status,
		default: 'pending',
	},
	confirmationCode: {
		type: String,
		unique: true,
	},
	favRecipes: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Recipe',
		},
	],
});

export interface UserDocument extends IUser, Document {}

export default model<IUser>('User', UserSchema, 'users');
