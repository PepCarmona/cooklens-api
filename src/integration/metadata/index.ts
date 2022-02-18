import { RecipeIntegration } from '..';
import { InstructionMetadata, RecipeMetadata } from './types';

import { getTimeFromMetadataString } from '../../helpers/dateTime';
import { sanitizeWhiteSpaces } from '../../helpers/string';
import { scrapeMetadata } from './scrape';

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
			? metadata.recipeYield[0]
			: metadata.recipeYield;

		this.ingredients = metadata.recipeIngredient.map((x) => ({ name: x }));

		this.instructions = Array.isArray(metadata.recipeInstructions)
			? metadata.recipeInstructions.map(
					(x: string | InstructionMetadata, i: number) => ({
						content: sanitizeWhiteSpaces(typeof x === 'string' ? x : x.text),
						position: i + 1,
					})
			  )
			: [
					{
						content: metadata.recipeInstructions,
						position: 1,
					},
			  ];

		const categoryArray: string[] = Array.isArray(metadata.recipeCategory)
			? metadata.recipeCategory
			: metadata.recipeCategory?.split(', ') ?? [];

		const cuisineArray: string[] = Array.isArray(metadata.recipeCuisine)
			? metadata.recipeCuisine
			: metadata.recipeCuisine?.split(', ').filter((x) => x !== '') ?? [];

		this.tags = [...new Set(categoryArray.concat(cuisineArray))].map((x) => ({
			value: x,
		}));

		this.images = Array.isArray(metadata.image)
			? metadata.image.flat().map((x) => (typeof x === 'string' ? x : x.url))
			: typeof metadata.image === 'string'
			? [metadata.image]
			: [metadata.image.url];

		this.rating = metadata.aggregateRating
			? metadata.aggregateRating.bestRating
				? (metadata.aggregateRating.ratingValue /
						parseInt(metadata.aggregateRating.bestRating)) *
				  5
				: metadata.aggregateRating.ratingValue > 5
				? 0
				: metadata.aggregateRating.ratingValue
			: 0;

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
