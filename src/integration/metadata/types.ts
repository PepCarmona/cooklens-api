export interface Metadata {
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

export interface InstructionMetadata extends Metadata {
	'@type': 'HowToStep';
	text: string;
}

export interface RecipeMetadata extends Metadata {
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
