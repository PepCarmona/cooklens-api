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

interface Tag {
  value: string;
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
        quantity: {
            type: Number,
            required: true,
        },
        units: String,
        name: {
            type: String,
            required: true,
        }
    }
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
        }
    }
);

const TagSchema = new Schema<Tag>(
    {
        value: {
            type: String,
            required: true,
        }
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
        tags: [TagSchema],
    }
);

export interface RecipeDocument extends IRecipe, Document {}

export default model<IRecipe>('Recipe', RecipeSchema, 'recipes');
