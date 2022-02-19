import scrapeIt from 'scrape-it';
import { Step, Tag } from 'cooklens-types';
import { InstructionMetadata, Metadata, RecipeMetadata } from './types';
import { tryJsonParse } from '../../helpers/json';
import { sanitizeWhiteSpaces } from '../../helpers/string';

interface ScrapedRecipeMetadata {
	title: string;
	recipeMetadata?: RecipeMetadata;
	hasMetadata: boolean;
}
export async function scrapeMetadata(
	url: string
): Promise<ScrapedRecipeMetadata> {
	const scrapedResult = await scrapeIt<{ title: string; metadata: string }>(
		url.toString(),
		{
			title: 'title',
			metadata: '[type="application/ld+json"]',
		}
	).catch((err) => Promise.reject(err));

	if (scrapedResult.data.metadata.length === 0) {
		return {
			title: scrapedResult.data.title,
			hasMetadata: false,
		};
	}

	try {
		const splittedMetadatas: string[] = scrapedResult.data.metadata
			.replace(/}{/g, '}$delimiter${')
			.split('$delimiter$');

		const metadatas: Metadata[] = splittedMetadatas
			.map((x) => {
				const m: Metadata = tryJsonParse(x);
				return m['@graph'] ? m['@graph'] : m;
			})
			.flat();

		const recipeMetadata = metadatas.find(
			(item) => item['@type'] === 'Recipe' || item['@type'].includes('Recipe')
		) as RecipeMetadata;

		return {
			title: scrapedResult.data.title,
			recipeMetadata,
			hasMetadata: false,
		};
	} catch {
		return {
			title: scrapedResult.data.title,
			hasMetadata:
				scrapedResult.data.metadata.includes('"@type": "Recipe"') ||
				scrapedResult.data.metadata.includes('"@type":"Recipe"'),
		};
	}
}

export function getIngredientsFromMetadata(metadata: RecipeMetadata): Step[] {
	return Array.isArray(metadata.recipeInstructions)
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
}

export function getTagsFromMetadata(metadata: RecipeMetadata): Tag[] {
	const categoryArray: string[] = Array.isArray(metadata.recipeCategory)
		? metadata.recipeCategory
		: metadata.recipeCategory?.split(', ') ?? [];

	const cuisineArray: string[] = Array.isArray(metadata.recipeCuisine)
		? metadata.recipeCuisine
		: metadata.recipeCuisine?.split(', ').filter((x) => x !== '') ?? [];

	return [...new Set(categoryArray.concat(cuisineArray))].map((x) => ({
		value: x,
	}));
}

export function getImagesFromMetadata(metadata: RecipeMetadata): string[] {
	return Array.isArray(metadata.image)
		? metadata.image.flat().map((x) => (typeof x === 'string' ? x : x.url))
		: typeof metadata.image === 'string'
		? [metadata.image]
		: [metadata.image.url];
}

export function getRatingFromMetadata(metadata: RecipeMetadata): number {
	return metadata.aggregateRating
		? metadata.aggregateRating.bestRating
			? (metadata.aggregateRating.ratingValue /
					parseInt(metadata.aggregateRating.bestRating)) *
			  5
			: metadata.aggregateRating.ratingValue > 5
			? 0
			: metadata.aggregateRating.ratingValue
		: 0;
}
