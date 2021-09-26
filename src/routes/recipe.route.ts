import express from 'express';
import { CallbackError } from 'mongoose';
import { URL } from 'url';
import { AllRecipesIntegration } from '../integration/allRecipes';
import { integratedSites, RecipeIntegration } from '../integration/config';
import Recipe, { IRecipe, RecipeDocument } from '../models/recipe.model';

const recipeRouter = express.Router();
const defaultLimitPerPage = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function paginate(query: any, req: any, res: any) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || defaultLimitPerPage;
    const skip = (page - 1) * limit;
    
    query
        .sort({ _id: 1 })
        .limit(limit === 0 ? limit  : limit + 1)
        .skip(skip)
        .then((recipes: RecipeDocument[]) => {
            const next = recipes.length === limit + 1;

            if (limit !== 0 && next) { 
                recipes.pop();
            }

            res.status(200).json({
                recipes,
                next,
                limit: limit === 0 ? limit  : limit + 1,
                length: recipes.length,
            });
        })
        .catch((err : CallbackError) => {
            res.status(404).send(err);
        });
}

recipeRouter.route('/get').get((req, res) => {
    if (req.query.id) {
        Recipe
            .findById(req.query.id)
            .then((recipe: IRecipe | null) => {
                res.status(200).json(recipe);
            })
            .catch((err: CallbackError) => {
                if (err?.name === 'CastError') {
                    res.status(404).send('The provided id is not valid');
                }
                else {
                    res.status(404).send(err);
                }
            });
    }
    else if (req.query.random) {
        Recipe
            .count()
            .then((count) => {
                const random = Math.floor(Math.random() * count);

                Recipe
                    .findOne()
                    .skip(random)
                    .then((recipe) => {
                        res.status(200).json(recipe);
                    })
                    .catch((err) => {
                        res.status(404).send(err);
                    });
            })
            .catch((err) => {
                res.status(404).send(err);
            });
    }
    else {
        paginate(Recipe.find(), req, res);
    }
});

recipeRouter.route('/search').get((req, res) => {
    const searchType = req.query.searchType;
    const searchText = req.query.searchText;

    let filter = {};

    let regex = new RegExp('.*');

    try {
        regex = new RegExp(searchText?.toString() || '.*', 'i');
    } catch (error) {
        res.status(400).send(error);
    }
    
    switch (searchType) {
    case 'title':
        filter = { title: regex };
        break;
    case 'ingredient':
        filter = { 'ingredients.name': regex };
        break;
    case 'tag':
        filter = { 'tags.value': regex };
        break;
    }
    paginate(Recipe.find(filter), req, res);
});

recipeRouter.route('/add').post((req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(404).send('Cannot save empty objects');
        return;
    }
    
    const recipe = new Recipe(req.body);
    
    recipe
        .save()
        .then((recipe: IRecipe) => {
            res.status(200).json(recipe);
        })
        .catch(() => res.status(400).send('Unable to save item to database'));
});

recipeRouter.route('/update').put((req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(404).send('Cannot save empty objects');
        return;
    }
    if (!req.query.id) {
        res.status(404).send('Document Id not provided');
        return;
    }
    
    Recipe
        .findByIdAndUpdate(req.query.id, req.body, {new: true})
        .then((recipe: IRecipe | null) => {
            if (!recipe) {
                res.status(404).send('Document with provided id not found');
            }
            else {
                res.status(200).json(recipe);
            }
        })
        .catch((err) => {
            res.status(404).send(err);
        });
});

recipeRouter.route('/delete').delete((req, res) => {
    if (!req.query.id) {
        res.status(404).send('Document Id not provided');
        return;
    }
    
    Recipe
        .findByIdAndDelete(req.query.id)
        .then((recipe: IRecipe | null) => {
            if (!recipe) {
                res.status(404).send('Document with provided id not found');
            }
            else {
                res.status(200).json(recipe);
            }
        })
        .catch((err) => {
            res.status(404).send(err);
        });
});

recipeRouter.route('/import').get((req, res) => {
    if (!req.query.url) {
        res.status(400).send('URL query parameter not provided');
        return;
    }

    const urlString = String(req.query.url);
    let url = null;

    try {
        url = new URL(urlString);
    }
    catch {
        res.status(500).send('URL could not be parsed');
        return;
    }
     
    if (!Object.values(integratedSites).includes(url.hostname)) {
        res.status(400).send('This site is not integrated yet');
        return;
    }
    
    let recipe: RecipeIntegration | null = null;
    switch (url.hostname) {
    case integratedSites.allRecipes:
        if (url.pathname.split('/')[1] !== 'recipe') {
            res.status(400).send('This page does not contain a suported format recipe.');
            return;
        }

        recipe = new AllRecipesIntegration(urlString);
        recipe.populate()
            .then(() => {
                if (recipe === null) {
                    res.status(400).send('Recipe integration failed');
                    return;
                }
                Recipe.findOne({ url: recipe.url })
                    .then((foundRecipe: IRecipe | null) => {
                        if (foundRecipe !== null) {
                            res.status(300).send('There already exists a recipe imported from this same url');
                            return;
                        }
                        if (recipe === null) {
                            res.status(400).send('Recipe integration failed');
                            return;
                        }
                        if (!req.query.save) {
                            res.status(200).json(recipe);
                            return;
                        }
                        const DB_recipe = new Recipe(recipe);
                        DB_recipe
                            .save()
                            .then((recipe: IRecipe) => {
                                res.status(200).json(recipe);
                            })
                            .catch(() => res.status(400).send('Unable to save item to database'));
                    })
                    .catch((err) => res.status(500).send(err));
            })
            .catch(() => res.status(500).send('Could not format recipe from this url. Title tag is missing.'));
        break;
    default:
        res.status(400).send('This site is not integrated yet');
    }
});

recipeRouter.route('/integrated-sites').get((req, res) => {
    if (!integratedSites) {
        res.status(404);
        return;
    }

    res.status(200).json(integratedSites);
});

export default recipeRouter;