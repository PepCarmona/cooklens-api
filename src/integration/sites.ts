import { allRecipes } from './allRecipes';
import { delish } from './delish';
import { simplyRecipes } from './simplyRecipes';

export interface SiteIntegration {
    url: string;
    // search?: string;
    recipeTitle: string;
    recipeDescription?: string;
    recipePrepTime?: string;
    recipeCookTime: string;
    recipeServings?: string;
    recipeIngredients: string;
    recipeIngredientsQuantity?: string;
    recipeInstructions: string;
    recipeTags?: string;
    images?: string;
}
export interface integratedSite {
    name: string;
    url: string;
    integration: SiteIntegration;
}

export const integratedSites: integratedSite[] = [
    {
        name: 'allRecipes',
        url: 'www.allrecipes.com',
        integration: allRecipes,
    },
    {
        name: 'delish',
        url: 'www.delish.com',
        integration: delish,
    },
    {
        name: 'simplyRecipes',
        url: 'www.simplyrecipes.com',
        integration: simplyRecipes,
    }
];