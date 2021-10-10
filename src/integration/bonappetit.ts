import { SiteIntegration } from './sites';

export const bonappetit: SiteIntegration = {
    url: 'https://www.bonappetit.com/',
    recipeTitle: 'h1[data-testid]',
    recipeDescription: '.container--body-inner > p',
    recipeServings: 'p[class*="Yield"]',
    recipeIngredients: 'div[class*="Description"]',
    recipeIngredientsQuantity: 'p[class*="Amount"]',
    recipeInstructions: 'div[class*="InstructionBody"]',
    images: 'picture[class*="SplitScreenContentHeaderLede"] > img',
};