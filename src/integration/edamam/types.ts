export const healthTypes = [
	'alcohol-cocktail',
	'alcohol-free',
	'celery-free',
	'crustacean-free',
	'dairy-free',
	'DASH',
	'egg-free',
	'fish-free',
	'fodmap-free',
	'gluten-free',
	'immuno-supportive',
	'keto-friendly',
	'kidney-friendly',
	'kosher',
	'low-fat-abs',
	'low-potassium',
	'low-sugar',
	'lupine-free',
	'Mediterranean',
	'mollusk-free',
	'mustard-free',
	'no-oil-added',
	'paleo',
	'peanut-free',
	'pescatarian',
	'pork-free',
	'red-meat-free',
	'sesame-free',
	'shellfish-free',
	'soy-free',
	'sugar-conscious',
	'sulfite-free',
	'tree-nut-free',
	'vegan',
	'vegetarian',
	'wheat-free',
] as const;

export const cuisineTypes = [
	'American',
	'Asian',
	'British',
	'Caribbean',
	'Central Europe',
	'Chinese',
	'Eastern Europe',
	'French',
	'Indian',
	'Italian',
	'Japanese',
	'Kosher',
	'Mediterranean',
	'Mexican',
	'Middle Eastern',
	'Nordic',
	'South American',
	'South East Asian',
] as const;

export const mealTypes = [
	'Breakfast',
	'Dinner',
	'Lunch',
	'Snack',
	'Teatime',
] as const;

export const dishTypes = [
	'Biscuits and cookies',
	'Bread',
	'Cereals',
	'Condiments and sauces',
	'Desserts',
	'Drinks',
	'Main course',
	'Pancake',
	'Preps',
	'Preserve',
	'Salad',
	'Sandwiches',
	'Side dish',
	'Soup',
	'Starter',
	'Sweets',
] as const;

export type HealthType = typeof healthTypes[number];
export type CuisineType = typeof cuisineTypes[number];
export type MealType = typeof mealTypes[number];
export type DishType = typeof dishTypes[number];

export interface Response {
	from: number;
	to: number;
	count: number;
	_links: {
		next?: {
			href: string;
			title: string;
		};
	};
	hits: {
		recipe: Recipe;
	}[];
}
export interface Recipe {
	label: string;
	image: string;
	images: {
		THUMBMNAIL?: Image;
		SMALL?: Image;
		REGULAR?: Image;
		LARGE?: Image;
	};
	source: string;
	url: string;
	yield: number;
	totalTime: number;
	ingredients: Ingredient[];
	healthLabels: HealthType[];
	cuisineType: CuisineType[];
	mealType: MealType[];
	dishType: DishType[];
	dietLabels: string[];
	cautions: string[];
}

interface Image {
	url: string;
	width: number;
	height: number;
}

interface Ingredient {
	text: string;
	quantity: number;
	measure: string;
	food: string;
	foodCategory: string;
}
