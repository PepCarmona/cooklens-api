import { IRecipe } from '../models/recipe.model';
import { RecipeTime, Ingredient, Step, Tag } from 'cooklens-types';

export interface RecipeIntegrationInterface extends IRecipe {
	populate(): any;
}

export class RecipeIntegration implements RecipeIntegrationInterface {
	url: string;
	title = '';
	description?: string;
	time?: RecipeTime;
	servings = '4';
	ingredients: Ingredient[] = [];
	instructions: Step[] = [];
	tags: Tag[] = [];
	images: string[] = [];
	rating = 0;
	isIntegrated = false;
	hasRecipeMetadata = false;

	constructor(url: string) {
		this.url = url;

		if (this.constructor == RecipeIntegration) {
			throw new Error('Abstract classes can not be instantiated');
		}
	}

	populate() {
		Promise.reject('This method is not implemented');
	}
}
