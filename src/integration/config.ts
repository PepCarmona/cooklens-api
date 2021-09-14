import { IRecipe } from '../models/recipe.model';

export interface SiteIntegration {
    url: string;
    search?: string;
    recipeTitle: string;
    recipeDescription?: string;
    recipePrepTime?: string;
    recipeCookTime: string;
    recipeServings?: string;
    recipeIngredients: string;
    recipeInstructions: string;
    recipeTags?: string;
}

export interface RecipeIntegration extends IRecipe {
    populate(): Promise<void>;
}

export const integratedSites = {
    allRecipes: 'www.allrecipes.com'
};