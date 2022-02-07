import { IRecipe } from '../models/recipe.model';
import { getTimeFromString } from '../helpers/dateTime';
import { RecipeTime, Ingredient, Step, Tag } from 'cooklens-types';
import scrapeIt from 'scrape-it';
import { sanitizeWhiteSpaces } from '../helpers/string';

interface Metadata {
	'@type': string;
}
interface RecipeMetadata extends Metadata {
	name: string;
	image: {
		url: string;
	};
	description: string;
	prepTime: string; //P0DT0H30M
	cookTime: string; //P0DT0H30M
	totalTime: string; //P0DT0H30M
	recipeYield: string;
	recipeIngredient: string[];
	recipeInstructions: {
		text: string;
	}[];
	recipeCategory: string[];
	recipeCuisine: string[];
	author: {
		name: string;
		url: string;
	};
	aggregateRating: {
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
	images!: any[];
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

		const metadata: Metadata[] = JSON.parse(scrapedResult.data.metadata);

		const recipeMetadata = metadata.find(
			(item) => item['@type'] === 'Recipe'
		) as RecipeMetadata;

		if (recipeMetadata) {
			this.populateFromMetadata(recipeMetadata);
		}
	}

	private populateFromMetadata(metadata: RecipeMetadata) {
		this.title = metadata.name;
		this.description = metadata.description;
		this.time = {
			preparation: getTimeFromString(metadata.prepTime),
			cooking: getTimeFromString(metadata.cookTime),
		};
		this.servings = metadata.recipeYield;
		this.ingredients = metadata.recipeIngredient.map((x) => ({ name: x }));
		this.instructions = metadata.recipeInstructions.map((x, i) => ({
			content: sanitizeWhiteSpaces(x.text),
			position: i + 1,
		}));
		this.tags = [
			...new Set(metadata.recipeCategory.concat(metadata.recipeCuisine)),
		].map((x) => ({ value: x }));
		this.images = [metadata.image.url];
		this.rating =
			(metadata.aggregateRating.ratingValue /
				parseInt(metadata.aggregateRating.bestRating)) *
			5;
		this.isIntegrated = true;
	}

	private populateAsLink(title: string) {
		this.title = title;
	}
}
