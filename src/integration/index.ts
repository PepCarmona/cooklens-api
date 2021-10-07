import { Ingredient, IRecipe, RecipeTime, Step, Tag } from '../models/recipe.model';
import { getTimeFromString } from '../helpers/dateTime';
import puppeteer from 'puppeteer';

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

export interface RecipeIntegrationInterface extends IRecipe {
    populate(site: SiteIntegration): Promise<void>;
}

export class RecipeIntegration implements RecipeIntegrationInterface {
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

    async populate(site: SiteIntegration): Promise<void> {
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
            page.$eval(site.recipeTitle, (x) => x.textContent)
                .then((title) => {
                    if (!title) {
                        console.error('No title in import URL');
                    }
            
                    this.title = title ?? '';
                }),

            // Description
            site.recipeDescription 
                ? page.$eval(site.recipeDescription, (x) => x.textContent)
                    .then((description) => this.description = description ?? '')
                : this.description = '',

            // Preparation Time
            site.recipePrepTime 
                ? page.$eval(site.recipePrepTime, (x) => x.textContent)
                    .then((prepTime) => stringTime.preparation = prepTime)
                : stringTime.preparation = '',

            // Cooking Time
            page.$eval(site.recipeCookTime, (x) => x.textContent)
                .then((cookingTime) => stringTime.cooking = cookingTime)
            ,

            // Servings
            site.recipeServings
                ? page.$eval(site.recipeServings, (x) => x.textContent)
                    .then((servings) => stringServings = servings)
                : stringServings = '4',

            // Ingredients
            page.$$eval(site.recipeIngredients, (X) => X.map((x) => x.textContent))
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
            site.recipeIngredientsQuantity
                ? page.$$eval(site.recipeIngredientsQuantity, (X) => X.map(x => x.textContent!))
                    .then((quantity) => stringQuantity = quantity)
                : stringQuantity = [],

            // Instructions
            page.$$eval(site.recipeInstructions, (X) => X.map((x) => x.textContent))
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
            site.recipeTags
                ? page.$$eval(site.recipeTags, (X) => X.map((x) => x.textContent!))
                    .then((tags) => 
                        this.tags = tags.map((tag) => {
                            return { value: tag };
                        })
                    )
                : this.tags = [],

            // Image
            site.images
                ? page.$$eval(site.images!, (X) => X.map((x) => x.getAttribute('src')!))
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