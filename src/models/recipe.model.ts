import { Document, model, Schema } from 'mongoose';
import { RecipeTime, Ingredient, Step, Tag, Recipe } from 'cooklens-types';

export type IRecipe = Omit<Recipe, '_id'>;

const RecipeTimeSchema = new Schema<RecipeTime>(
	{
		preparation: Number,
		cooking: {
			type: Number,
			required: true,
		},
	},
	{ _id: false }
);

const IngredientSchema = new Schema<Ingredient>(
	{
		quantity: Number,
		units: String,
		name: {
			type: String,
			required: true,
		},
	},
	{ _id: false }
);

const StepSchema = new Schema<Step>(
	{
		position: {
			type: Number,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
	},
	{ _id: false }
);

const TagSchema = new Schema<Tag>(
	{
		value: {
			type: String,
			required: true,
		},
	},
	{ _id: false }
);

const RecipeSchema = new Schema<IRecipe>({
	url: String,
	title: {
		type: String,
		required: true,
	},
	description: String,
	time: RecipeTimeSchema,
	servings: {
		type: Number,
		default: 4,
	},
	ingredients: [IngredientSchema],
	instructions: [StepSchema],
	tags: [TagSchema],
	images: [String],
	rating: Number,
	author: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	isIntegrated: Boolean,
});

export interface RecipeDocument extends IRecipe, Document {}

export default model<IRecipe>('Recipe', RecipeSchema, 'recipes');
