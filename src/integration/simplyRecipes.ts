import { SiteIntegration } from './sites';

export const simplyRecipes: SiteIntegration = {
    url: 'https://www.simplyrecipes.com/',
    recipeTitle: '.heading__title',
    recipeDescription: '.heading__subtitle',
    recipePrepTime: '.prep-time .meta-text__data',
    recipeCookTime: '.cook-time .meta-text__data',
    recipeServings: '.recipe-serving .meta-text__data',
    recipeIngredients: '.ingredient-list > li.simple-list__item',
    recipeInstructions: '.structured-project__steps li',
    images: '.figure-portrait img',
};