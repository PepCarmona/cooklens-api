import { RecipeIntegration } from '..';
import { getTimeFromMetadataString } from '../../helpers/dateTime';
import {
	getIngredientsFromMetadata,
	getRatingFromMetadata,
	scrapeMetadata,
} from '../metadata/scrape';
import { RecipeMetadata } from '../metadata/types';
import { Recipe } from './types';

export class EdamamRecipeIntegration extends RecipeIntegration {
	public populate(recipe: Recipe) {
		this.isIntegrated = true;
		this.populateFromEdamamRecipe(recipe);

		return scrapeMetadata(this.url)
			.then(({ recipeMetadata }) => {
				if (recipeMetadata) {
					this.completePopulationFromMetadata(recipeMetadata);
				}
			})
			.catch((err) => err);
	}

	private populateFromEdamamRecipe(recipe: Recipe) {
		this.title = recipe.label;

		this.images = Object.values(recipe.images).map((img) => img.url);

		this.servings = recipe.yield?.toString();

		this.time = {
			cooking: recipe.totalTime,
		};

		this.ingredients = recipe.ingredients.map((ingredient) => ({
			quantity: ingredient.quantity,
			units: ingredient.measure === '<unit>' ? '' : ingredient.measure,
			name: ingredient.food,
		}));
	}

	private completePopulationFromMetadata(metadata: RecipeMetadata) {
		const { description, prepTime, cookTime } = metadata;

		this.hasRecipeMetadata = true;

		this.description = description;

		if (prepTime && cookTime) {
			this.time = {
				preparation: getTimeFromMetadataString(prepTime),
				cooking: getTimeFromMetadataString(cookTime),
			};
		}

		this.instructions = getIngredientsFromMetadata(metadata);

		this.rating = getRatingFromMetadata(metadata);
	}
}
