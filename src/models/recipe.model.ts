import { Document, model, Schema } from 'mongoose';

export interface IRecipe {
  title: string;
  body: string;
}

const RecipeSchema = new Schema<IRecipe>(
    {
        title: String,
        body: String,
    }
);

export interface RecipeDocument extends IRecipe, Document {}

export default model<IRecipe>('Recipe', RecipeSchema, 'recipes');
