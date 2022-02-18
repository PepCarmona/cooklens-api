import scrapeIt from 'scrape-it';
import { Metadata, RecipeMetadata } from './types';
import { tryJsonParse } from '../../helpers/json';

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
