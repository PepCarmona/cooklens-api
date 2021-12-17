import { Document, model, Schema } from 'mongoose';
import { IWeeklyPlan } from './weekPlan.models';
import { IRecipe } from './recipe.model';

export const roles = ['admin', 'user', 'guest'] as const;
export type Role = typeof roles[number];

export const status = ['active', 'pending'] as const;
export type Status = typeof status[number];

export interface SigninForm {
    username: string;
    password: string;
}

export interface SignupForm extends SigninForm {
    email: string;
}

export interface IUser {
    username: string;
    email: string;
    password: string;
    role: Role;
    status: Status;
    confirmationCode: string;
    favRecipes: Schema.Types.ObjectId[] | IRecipe[];
    weekPlans: Schema.Types.ObjectId[] | IWeeklyPlan[];
}

export interface IUserWithId extends IUser {
    _id: Schema.Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
    {
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
            default: 'user'
        },
        status: {
            type: String,
            enum: status,
            default: 'pending'
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
        weekPlans: [
            {
                type: Schema.Types.ObjectId,
                ref: 'WeeklyPlan',
            }
        ]
    }
);

export interface UserDocument extends IUser, Document {}

export default model<IUser>('User', UserSchema, 'users');