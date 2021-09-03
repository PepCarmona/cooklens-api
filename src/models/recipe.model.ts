import { Document, model, Schema } from 'mongoose';

export interface IRecipe {
  title: string;
  body: string;
}

<<<<<<< HEAD
const RecipeSchema = new Schema<IRecipe>(
    {
        title: String,
        body: String,
    }
=======
const RecipeSchema = new Schema<Recipe>(
	{
		title: String,
		body: String,
	}
>>>>>>> f523fea... Add endpoints for getting and setting recipes to database
);

export interface RecipeDocument extends IRecipe, Document {}

export default model<IRecipe>('Recipe', RecipeSchema, 'recipes');
