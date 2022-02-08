import { IRecipe } from '../models/recipe.model';
import { getTimeFromMetadataString } from '../helpers/dateTime';
import { RecipeTime, Ingredient, Step, Tag } from 'cooklens-types';
import scrapeIt from 'scrape-it';
import { sanitizeWhiteSpaces } from '../helpers/string';
import { tryJsonParse } from '../helpers/json';

interface Metadata {
	'@type': string | string[];
	'@context': string;
	'@graph': Metadata[];
}

interface AuthorMetadata extends Metadata {
	'@type': 'Person';
	name: string;
	description?: string;
	url?: string;
}

interface ImageMetadata extends Metadata {
	'@type': 'ImageObject';
	url: string;
	height: number;
	width: number;
}

interface InstructionMetadata extends Metadata {
	'@type': 'HowToStep';
	text: string;
}
interface RecipeMetadata extends Metadata {
	name: string;
	image:
		| string
		| string[]
		| [string | string[]]
		| ImageMetadata
		| ImageMetadata[];
	description: string;
	prepTime?: string; //P0DT0H30M | PT20M
	cookTime?: string; //P0DT0H30M | PT20M
	totalTime?: string; //P0DT0H30M | PT20M
	recipeYield: string | string[];
	recipeIngredient: string[];
	recipeInstructions: string | string[] | InstructionMetadata[];
	recipeCategory?: string | string[];
	recipeCuisine?: string | string[];
	author: AuthorMetadata | AuthorMetadata[];
	aggregateRating?: {
		ratingValue: number;
		ratingCount: number;
		bestRating?: string;
		worstRating?: string;
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
	hasRecipeMetadata = false;

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

			if (recipeMetadata) {
				this.populateFromMetadata(recipeMetadata);
				return;
			}

			this.populateAsLink(scrapedResult.data.title);
		} catch {
			this.populateAsLink(
				scrapedResult.data.title,
				scrapedResult.data.metadata.includes('"@type": "Recipe"') ||
					scrapedResult.data.metadata.includes('"@type":"Recipe"')
			);
		}
	}

	private populateFromMetadata(metadata: RecipeMetadata) {
		console.log('populateFromMetadata');
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
			? metadata.recipeInstructions.map((x, i) => ({
					content: sanitizeWhiteSpaces(typeof x === 'string' ? x : x.text),
					position: i + 1,
			  }))
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
		console.log('populateAsLink');
		this.title = title;

		this.hasRecipeMetadata = hasMetadata;
	}
}
