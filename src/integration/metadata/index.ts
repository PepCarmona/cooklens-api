import { RecipeIntegration } from '..';
import { RecipeMetadata } from './types';

import { getTimeFromMetadataString } from '../../helpers/dateTime';
import {
	getImagesFromMetadata,
	getIngredientsFromMetadata,
	getRatingFromMetadata,
	getTagsFromMetadata,
	scrapeMetadata,
} from './scrape';

export class MetadataRecipeIntegration extends RecipeIntegration {
	public populate(): Promise<void> {
		let url: URL;

		try {
			url = new URL(this.url);
		} catch {
			return Promise.reject('URL could not be parsed');
		}

		return scrapeMetadata(url.toString())
			.then(({ title, recipeMetadata, hasMetadata }) => {
				if (recipeMetadata) {
					this.populateFromMetadata(recipeMetadata);
				} else {
					this.populateAsLink(title, hasMetadata);
				}
			})
			.catch((err) => Promise.reject(err));
	}

	private populateFromMetadata(metadata: RecipeMetadata) {
		this.title = metadata.name;

		this.description = metadata.description;

		this.time = {
			preparation: metadata.prepTime
				? getTimeFromMetadataString(metadata.prepTime)
				: undefined,
			cooking: metadata.cookTime
				? getTimeFromMetadataString(metadata.cookTime)
				: 0,
		};

		this.servings = Array.isArray(metadata.recipeYield)
			? parseInt(metadata.recipeYield[0]) || 4
			: parseInt(metadata.recipeYield) || 4;

		this.ingredients = metadata.recipeIngredient.map((x) => ({ name: x }));

		this.instructions = getIngredientsFromMetadata(metadata);

		this.tags = getTagsFromMetadata(metadata);

		this.images = getImagesFromMetadata(metadata);

		this.rating = getRatingFromMetadata(metadata);

		this.isIntegrated = true;
		this.hasRecipeMetadata = true;
	}

	private populateAsLink(title: string, hasMetadata = false) {
		this.title = [
			'403 Forbidden',
			'Access to this page has been denied.',
		].includes(title)
			? ''
			: title;

		this.hasRecipeMetadata = hasMetadata;
	}
}
