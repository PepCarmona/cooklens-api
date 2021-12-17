import { model, Schema } from 'mongoose';
import { IRecipe } from './recipe.model';
import { IUser } from './user.model';

interface DailyPlan {
	lunch?: Schema.Types.ObjectId | IRecipe;
	dinner?: Schema.Types.ObjectId | IRecipe;
}

export interface IWeeklyPlan {
	name: string;
	dailyPlans?: [
		DailyPlan,
		DailyPlan,
		DailyPlan,
		DailyPlan,
		DailyPlan,
		DailyPlan,
		DailyPlan
	];
	author: Schema.Types.ObjectId | IUser;
}

export interface IWeeklyPlanWithId extends IWeeklyPlan {
	_id: Schema.Types.ObjectId;
}

const DailyPlanSchema = new Schema<DailyPlan>(
	{
		lunch: {
			type: Schema.Types.ObjectId,
			ref: 'Recipe',
		},
		dinner: {
			type: Schema.Types.ObjectId,
			ref: 'Recipe',
		},
	},
	{ _id: false }
);

const WeeklyPlanSchema = new Schema<IWeeklyPlan>({
	name: {
		type: String,
		required: true,
	},
	dailyPlans: [DailyPlanSchema],
	author: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
});

export interface WeeklyPlannerDocument extends IWeeklyPlan, Document {}

export default model<IWeeklyPlan>(
	'WeeklyPlan',
	WeeklyPlanSchema,
	'weeklyPlans'
);
