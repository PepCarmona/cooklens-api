import { Document, model, Schema } from 'mongoose';

type Role = 'admin' | 'mod' | 'author' | 'guest'

export interface IUser {
    username: string;
    email: string;
    password: string;
    role?: Role;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: String,
    }
);

export interface UserDocument extends IUser, Document {}

export default model<IUser>('User', UserSchema, 'users');