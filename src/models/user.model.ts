import { Document, model, Schema } from 'mongoose';
import { IRecipe } from './recipe.model';

type Role = 'admin' | 'mod' | 'author' | 'guest'

export interface IUser {
    username: string;
    email: string;
    password: string;
    role?: Role;
    favRecipes: Schema.Types.ObjectId[] | IRecipe[];
}

export interface IUserWithId extends IUser {
    _id: Schema.Types.ObjectId;
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
        favRecipes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Recipe',
            },
        ]
    }
);

export interface UserDocument extends IUser, Document {}

export default model<IUser>('User', UserSchema, 'users');