import { Ingredient, IRecipe, RecipeTime, Step, Tag } from '../models/recipe.model';
import { getTimeFromString } from '../helpers/dateTime';
import puppeteer from 'puppeteer';
import { integratedSite } from './sites';

export interface RecipeIntegrationInterface extends IRecipe {
    populate(site: integratedSite): Promise<void>;
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

    async populate(site: integratedSite): Promise<void> {
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
            page.$eval(site.integration.recipeTitle, (x) => x.textContent)
                .then((title) => {
                    if (!title) {
                        console.error('No title in import URL');
                    }
            
                    this.title = title ?? '';
                }),

            // Description
            site.integration.recipeDescription 
                ? page.$eval(site.integration.recipeDescription, (x) => x.textContent)
                    .then((description) => this.description = description ?? '')
                : this.description = '',

            // Preparation Time
            site.integration.recipePrepTime 
                ? page.$eval(site.integration.recipePrepTime, (x) => x.textContent)
                    .then((prepTime) => stringTime.preparation = prepTime)
                : stringTime.preparation = '',

            // Cooking Time
            page.$eval(site.integration.recipeCookTime, (x) => x.textContent)
                .then((cookingTime) => stringTime.cooking = cookingTime)
            ,

            // Servings
            site.integration.recipeServings
                ? page.$eval(site.integration.recipeServings, (x) => x.textContent)
                    .then((servings) => stringServings = servings)
                : stringServings = '4',

            // Ingredients
            page.$$eval(site.integration.recipeIngredients, (X) => X.map((x) => {
                return {
                    name: x.textContent,
                    quantity: x.previousElementSibling?.textContent,
                };
            }))
                .then((ingredients) => 
                    this.ingredients = ingredients.some((ingredient) => ingredient.name! === null)
                        ? []
                        : ingredients.map((ingredient) => {
                            return {
                                quantity: 0,
                                name: site.name === 'delish'
                                    ? ingredient.quantity 
                                        ? (ingredient.quantity.replace(/\n|\t/g, '') + ' ').replace(/  +/g, ' ') + ingredient.name
                                        : ingredient.name!
                                    : ingredient.name!
                            };
                        })
                ),

            // Ingredients Quantity
            site.integration.recipeIngredientsQuantity
                ? page.$$eval(site.integration.recipeIngredientsQuantity, (X) => X.map(x => x.textContent!))
                    .then((quantity) => stringQuantity = quantity)
                : stringQuantity = [],

            // Instructions
            page.$$eval(site.integration.recipeInstructions, (X) => X.map((x) => x.textContent))
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
            site.integration.recipeTags
                ? page.$$eval(site.integration.recipeTags, (X) => X.map((x) => x.textContent!))
                    .then((tags) => 
                        this.tags = tags.map((tag) => {
                            return { value: tag };
                        })
                    )
                : this.tags = [],

            // Image
            site.integration.images
                ? page.$$eval(site.integration.images!, (X) => X.map((x) => x.getAttribute('src')!))
                    .then((images) => this.images = images)
                : this.images = [],
        ]);

        this.time = {
            preparation: getTimeFromString(stringTime.preparation, site),
            cooking: getTimeFromString(stringTime.cooking, site),
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