import { model, Schema } from 'mongoose';
import { DayMeal, meals, DayPlan, MealPlan } from 'cooklens-types';

export type IMealPlan = Omit<MealPlan, '_id'>;

const DayMealSchema = new Schema<DayMeal>(
	{
		meal: {
			type: String,
			enum: meals,
			required: true,
		},
		recipe: {
			type: Schema.Types.ObjectId,
			ref: 'Recipe',
		},
	},
	{ _id: false }
);

const DayPlanSchema = new Schema<DayPlan>(
	{
		date: {
			type: String,
			unique: true,
			required: true,
		},
		meals: [DayMealSchema],
	},
	{ _id: false }
);

const MealPlanSchema = new Schema<IMealPlan>({
	users: [
		{
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	days: [DayPlanSchema],
});

export interface MealPlanDocument extends IMealPlan, Document {}

export default model<IMealPlan>('MealPlan', MealPlanSchema, 'mealPlans');
