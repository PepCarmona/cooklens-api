import { Document, model, Schema } from 'mongoose';
import { IUser } from './user.model';

export interface RecipeTime {
  preparation?: number;
  cooking: number;
}

export interface Ingredient {
  quantity?: number;
  units?: string;
  name: string;
}

export interface Step {
  position: number;
  content: string;
}

export interface Tag {
  value: string;
}
export interface IRecipe {
  url?: string;
  title: string;
  description?: string;
  time: RecipeTime;
  servings: number;
  ingredients: Ingredient[];
  instructions: Step[];
  tags: Tag[];
  images?: string[];
  rating: number;
  author?: Schema.Types.ObjectId | IUser
}

export interface IRecipeWithId extends IRecipe {
    _id: Schema.Types.ObjectId;
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
            ref: 'User'
        }
    }
);

export interface RecipeDocument extends IRecipe, Document {}

export default model<IRecipe>('Recipe', RecipeSchema, 'recipes');
