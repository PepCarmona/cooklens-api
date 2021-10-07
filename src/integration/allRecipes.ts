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

        const [
            title, 
            description,
            prepTime,
            cookTime,
            servings,
            ingredients,
            instructions,
            instructionsQuantity,
            tags,
            images,
        ] = await Promise.all([
            // Title
            page.$eval(allRecipes.recipeTitle, (x) => x.textContent),

            // Description
            allRecipes.recipeDescription 
                ? page.$eval(allRecipes.recipeDescription, (x) => x.textContent) 
                : '',

            // Preparation Time
            allRecipes.recipePrepTime 
                ? page.$eval(allRecipes.recipePrepTime, (x) => x.textContent) 
                : '',

            // Cooking Time
            page.$eval(allRecipes.recipeCookTime, (x) => x.textContent),

            // Servings
            allRecipes.recipeServings
                ? page.$eval(allRecipes.recipeServings, (x) => x.textContent)
                : '4',

            // Ingredients
            page.$$eval(allRecipes.recipeIngredients, (X) => X.map((x) => x.textContent)),

            // Instructions
            page.$$eval(allRecipes.recipeInstructions, (X) => X.map((x) => x.textContent)),

            // Instructions Quantity
            allRecipes.recipeIngredientsQuantity
                ? page.$$eval(allRecipes.recipeIngredientsQuantity, (X) => X.map(x => x.textContent!))
                : [],

            // Tags
            allRecipes.recipeTags
                ? page.$$eval(allRecipes.recipeTags, (X) => X.map((x) => x.textContent!))
                : [],

            // Image
            allRecipes.images
                ? page.$$eval(allRecipes.images!, (X) => X.map((x) => x.getAttribute('src')!))
                : [],
        ]);

        if (!title) {
            throw new Error('Could not format recipe from this url. Title tag is missing.');
        }

        this.title = title ?? '';

        this.description = description ?? '';

        this.time.preparation = getTimeFromString(prepTime);

        this.time.cooking = getTimeFromString(cookTime);

        this.servings = parseInt(servings!);

        this.ingredients = ingredients.some((ingredient) => ingredient === null)
            ? []
            : ingredients.map((ingredient, index) => {
                return {
                    quantity: instructionsQuantity[index] ? parseInt(instructionsQuantity[index]) : 0,
                    name: ingredient!
                };
            });

        this.instructions = instructions.some((step) => step === null)
            ? []
            : instructions.map((step, index) => {
                return {
                    position: index + 1,
                    content: step!
                };
            });

        this.tags = tags.map((tag) => {
            return { value: tag };
        });

        this.images = images;

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