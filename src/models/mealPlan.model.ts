import { model, Schema } from 'mongoose';
import { IRecipe } from './recipe.model';
import { IUser } from './user.model';

export const meals = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type Meal = typeof meals[number];

interface DayMeal {
    meal: Meal;
    recipe: Schema.Types.ObjectId | IRecipe;
}

interface DayPlan {
    date: string;
    meals: DayMeal[];
}

export interface IMealPlan {
    users: (Schema.Types.ObjectId | IUser)[];
    days: DayPlan[];
}

export interface IMealPlanWithId extends IMealPlan {
    _id: Schema.Types.ObjectId;
}

const DayMealSchema = new Schema<DayMeal>(
    {
        meal: {
            type: String,
            required: true,
        },
        recipe: {
            type: Schema.Types.ObjectId,
            ref: 'Recipe',
        }
    },
    { _id: false }
);

const DayPlanSchema = new Schema<DayPlan>(
    {
        date: {
            type: String,
            required: true,
        },
        meals: [DayMealSchema]
    },
    { _id: false }
);

const MealPlanSchema = new Schema<IMealPlan>(
    {
        users: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        days: [DayPlanSchema]
    }
);

export interface MealPlanDocument extends IMealPlan, Document {}

export default model<IMealPlan>('MealPlan', MealPlanSchema, 'mealPlans');
