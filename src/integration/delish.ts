import { SiteIntegration } from './sites';

export const delish: SiteIntegration = {
	url: 'https://www.delish.com/',
	recipeTitle: '.content-hed.recipe-hed',
	recipeDescription: '.recipe-introduction p',
	recipePrepTime: '.prep-time-amount',
	recipeCookTime: '.total-time-amount',
	recipeIngredients: '.ingredient-description',
	recipeInstructions: '.direction-lists li',
	images: '.recipe-body-content .embed-image .lazyimage',
};
