/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Ingredient, RecipeTime, Step, Tag } from '../models/recipe.model';
import { RecipeIntegration, SiteIntegration } from './config';
import puppeteer from 'puppeteer';

const allRecipes: SiteIntegration = {
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

export class AllRecipesIntegration implements RecipeIntegration {
    url!: string;
    title!: string;
    description?: string;
    time!: RecipeTime;
    servings = 4;
    ingredients!: Ingredient[];
    instructions!: Step[];
    tags!: Tag[];
    images!: string[];
    rating = 0;

    constructor(url: string) {
        this.url = url;

        this.title = '';
        this.time = {
            preparation: 0,
            cooking: 5,
        };
    }

    async populate(): Promise<void> {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });
        const page = await browser.newPage();

        await page.goto(this.url);

        const stringTime: {
            preparation: string | null;
            cooking: string | null;
        } = {
            preparation: '',
            cooking: '',
        };

        let stringServings: string | null = null;

        let stringQuantity: (string | null)[] = [];
        
        await Promise.all([
            // Title
            page.$eval(allRecipes.recipeTitle, (x) => x.textContent)
                .then((title) => {
                    if (!title) {
                        throw new Error('Could not import recipe from this url. Title tag is missing.');
                    }
            
                    this.title = title ?? '';
                }),

            // Description
            allRecipes.recipeDescription 
                ? page.$eval(allRecipes.recipeDescription, (x) => x.textContent)
                    .then((description) => this.description = description ?? '')
                : this.description = '',

            // Preparation Time
            allRecipes.recipePrepTime 
                ? page.$eval(allRecipes.recipePrepTime, (x) => x.textContent)
                    .then((prepTime) => stringTime.preparation = prepTime)
                : stringTime.preparation = '',

            // Cooking Time
            page.$eval(allRecipes.recipeCookTime, (x) => x.textContent)
                .then((cookingTime) => stringTime.cooking = cookingTime)
            ,

            // Servings
            allRecipes.recipeServings
                ? page.$eval(allRecipes.recipeServings, (x) => x.textContent)
                    .then((servings) => stringServings = servings)
                : stringServings = '4',

            // Ingredients
            page.$$eval(allRecipes.recipeIngredients, (X) => X.map((x) => x.textContent))
                .then((ingredients) => 
                    this.ingredients = ingredients.some((ingredient) => ingredient === null)
                        ? []
                        : ingredients.map((ingredient) => {
                            return {
                                quantity: 0,
                                name: ingredient!
                            };
                        })
                ),

            // Ingredients Quantity
            allRecipes.recipeIngredientsQuantity
                ? page.$$eval(allRecipes.recipeIngredientsQuantity, (X) => X.map(x => x.textContent!))
                    .then((quantity) => stringQuantity = quantity)
                : stringQuantity = [],

            // Instructions
            page.$$eval(allRecipes.recipeInstructions, (X) => X.map((x) => x.textContent))
                .then((instructions) => 
                    this.instructions = instructions.some((step) => step === null)
                        ? []
                        : instructions.map((step, index) => {
                            return {
                                position: index + 1,
                                content: step!
                            };
                        })
                ),

            // Tags
            allRecipes.recipeTags
                ? page.$$eval(allRecipes.recipeTags, (X) => X.map((x) => x.textContent!))
                    .then((tags) => 
                        this.tags = tags.map((tag) => {
                            return { value: tag };
                        })
                    )
                : this.tags = [],

            // Image
            allRecipes.images
                ? page.$$eval(allRecipes.images!, (X) => X.map((x) => x.getAttribute('src')!))
                    .then((images) => this.images = images)
                : this.images = [],
        ]);

        this.time = {
            preparation: getTimeFromString(stringTime.preparation),
            cooking: getTimeFromString(stringTime.cooking),
        };

        this.servings = stringServings ? parseInt(stringServings) : 4;

        
        this.ingredients.map(
            (ingredient, index) => 
                ingredient.quantity = stringQuantity[index] 
                    ? parseInt(stringQuantity[index]!) 
                    : 0
        );

        await browser.close();
    }
}

function getTimeFromString(string: string | null): number {
    if (string === null) {
        return 0;
    }
    const hourIndex = string.indexOf('hr');
    const minuteIndex = string.indexOf('min');
    
    let hours = 0;
    let minutes = 0;

    if (hourIndex > -1) {
        hours = parseInt(string.substring(0, hourIndex).replace(/\D/g, ''));
    }

    if (minuteIndex > -1) {
        minutes = parseInt(string.substring(hourIndex, minuteIndex).replace(/\D/g, ''));
    }

    return hours * 60 + minutes;
}