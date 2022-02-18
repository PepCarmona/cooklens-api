import { RecipeIntegration } from '..';
import { Recipe } from './types';

export class EdamamRecipeIntegration extends RecipeIntegration {
	constructor(recipe: Recipe) {
		super(recipe.url);

		this.populate(recipe);
	}

	public async populate(recipe: Recipe) {
		this.title = recipe.label;

		this.images = Object.values(recipe.images).map((img) => img.url);

		this.servings = recipe.yield?.toString();

		this.time = {
			cooking: recipe.totalTime,
		};

		this.ingredients = recipe.ingredients.map((ingredient) => ({
			quantity: ingredient.quantity,
			units: ingredient.measure,
			name: ingredient.food,
		}));
	}
}
