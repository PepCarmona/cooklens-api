import { Document, model, Schema } from 'mongoose';

interface RecipeTime {
  preparation?: number;
  cooking: number;
}

interface Ingredient {
  quantity: number;
  units: string;
  name: string;
}

interface Step {
  position: number;
  content: string;
}
export interface IRecipe {
  title: string;
  description?: string;
  time: RecipeTime;
  servings: number;
  ingredients: Ingredient[];
  instructions: Step[];
  tags: string[];
}

const RecipeTimeSchema = new Schema<RecipeTime>(
    {
        preparation: Number,
        cooking: {
            type: Number,
            required: true,
        }
    }
);

const IngredientSchema = new Schema<Ingredient>(
    {
        quantity: Number,
        units: String,
        name: String,
    }
);

const StepSchema = new Schema<Step>(
    {
        position: Number,
        content: String,
    }
);

const RecipeSchema = new Schema<IRecipe>(
    {
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
        tags: [String],
    }
);

export interface RecipeDocument extends IRecipe, Document {}

export default model<IRecipe>('Recipe', RecipeSchema, 'recipes');
