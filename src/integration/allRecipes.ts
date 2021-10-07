import { SiteIntegration } from '.';

export const allRecipes: SiteIntegration = {
    url: 'https://www.allrecipes.com/',
    recipeTitle: 'h1.headline.heading-content',
    recipeDescription: '.recipe-summary p',
    recipePrepTime:
        '.two-subcol-content-wrapper:first-child > .recipe-meta-item:nth-child(1) > .recipe-meta-item-body',
    recipeCookTime:
        '.two-subcol-content-wrapper:first-child > .recipe-meta-item:nth-child(2) > .recipe-meta-item-body',
    recipeServings:
        '.two-subcol-content-wrapper:last-child > .recipe-meta-item:nth-child(1) > .recipe-meta-item-body',
    recipeIngredients: '.ingredients-item-name',
    recipeInstructions: '.instructions-section-item p',
    images: '.lazy-image[data-main-recipe] > .inner-container > img',
};