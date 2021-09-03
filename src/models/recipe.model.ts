import { Document, model, Schema } from 'mongoose';

export interface Recipe {
  title: string;
  body: string;
}

const RecipeSchema = new Schema<Recipe>(
	{
		title: String,
		body: String,
	}
);

export interface RecipeDocument extends Recipe, Document {}

export default model<Recipe>('Recipe', RecipeSchema, 'recipes');
