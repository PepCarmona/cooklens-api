import { IRecipe } from '../models/recipe.model';
import { getTimeFromMetadataString } from '../helpers/dateTime';
import { RecipeTime, Ingredient, Step, Tag } from 'cooklens-types';
import scrapeIt from 'scrape-it';
import { sanitizeWhiteSpaces } from '../helpers/string';

interface Metadata {
	'@type': string | string[];
}

interface AuthorMetadata extends Metadata {
	'@type': 'Person';
	name: string;
	description?: string;
	url: string;
}

interface ImageMetadata extends Metadata {
	'@type': 'ImageObject';
	url: string;
	height: number;
	width: number;
}
interface RecipeMetadata extends Metadata {
	name: string;
	image: ImageMetadata | ImageMetadata[];
	description: string;
	prepTime: string; //P0DT0H30M | PT20M
	cookTime: string; //P0DT0H30M | PT20M
	totalTime: string; //P0DT0H30M | PT20M
	recipeYield: string;
	recipeIngredient: string[];
	recipeInstructions: {
		text: string;
	}[];
	recipeCategory: string | string[];
	recipeCuisine?: string | string[];
	author: AuthorMetadata | AuthorMetadata[];
	aggregateRating?: {
		ratingValue: number;
		ratingCount: number;
		bestRating: string;
		worstRating: string;
	};
	video: {
		name: string;
		description: string;
		thumbnailUrl: string;
		embedUrl: string;
	};
}

export interface RecipeIntegrationInterface extends IRecipe {
	populate(): Promise<unknown>;
}

export class RecipeIntegration implements RecipeIntegrationInterface {
	url: string;
	title!: string;
	description?: string;
	time?: RecipeTime;
	servings = '4';
	ingredients!: Ingredient[];
	instructions!: Step[];
	tags!: Tag[];
	images!: string[];
	rating = 0;
	isIntegrated = false;

	constructor(url: string) {
		this.url = url;

		this.title = '';
	}

	public async populate() {
		let url: URL;

		try {
			url = new URL(this.url);
		} catch {
			return Promise.reject('URL could not be parsed');
		}

		const scrapedResult = await scrapeIt<{ title: string; metadata: string }>(
			url.toString(),
			{
				title: 'title',
				metadata: '[type="application/ld+json"]',
			}
		);

		if (scrapedResult.data.metadata.length === 0) {
			this.populateAsLink(scrapedResult.data.title);
			return;
		}

		const metadata: Metadata[] = scrapedResult.data.metadata
			.replace(/}{/g, '}$delimiter${')
			.split('$delimiter$')
			.map((x) => JSON.parse(x));

		const recipeMetadata = metadata.find(
			(item) => item['@type'] === 'Recipe' || item['@type'].includes('Recipe')
		) as RecipeMetadata;

		if (recipeMetadata) {
			this.populateFromMetadata(recipeMetadata);
			return;
		}

		this.populateAsLink(scrapedResult.data.title);
	}

	private populateFromMetadata(metadata: RecipeMetadata) {
		this.title = metadata.name;

		this.description = metadata.description;

		this.time = {
			preparation: getTimeFromMetadataString(metadata.prepTime),
			cooking: getTimeFromMetadataString(metadata.cookTime),
		};

		this.servings = metadata.recipeYield;

		this.ingredients = metadata.recipeIngredient.map((x) => ({ name: x }));

		this.instructions = metadata.recipeInstructions.map((x, i) => ({
			content: sanitizeWhiteSpaces(x.text),
			position: i + 1,
		}));

		const categoryArray: string[] = Array.isArray(metadata.recipeCategory)
			? metadata.recipeCategory
			: metadata.recipeCategory.split(', ');

		const cuisineArray: string[] = Array.isArray(metadata.recipeCuisine)
			? metadata.recipeCuisine
			: metadata.recipeCuisine?.split(', ') ?? [];

		this.tags = [...new Set(categoryArray.concat(cuisineArray))].map((x) => ({
			value: x,
		}));

		this.images = Array.isArray(metadata.image)
			? metadata.image.map((x) => x.url)
			: [metadata.image.url];

		this.rating = metadata.aggregateRating
			? (metadata.aggregateRating.ratingValue /
					parseInt(metadata.aggregateRating.bestRating)) *
			  5
			: 0;

		this.isIntegrated = true;
	}

	private populateAsLink(title: string) {
		this.title = title;
	}
}
