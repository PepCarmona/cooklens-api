import express from 'express';
import { CallbackError } from 'mongoose';
import { URL } from 'url';
import { CustomError } from '../helpers/errors';
import { paginate } from '../helpers/pagination';
import { RecipeIntegration } from '../integration';
import { integratedSites } from '../integration/sites';
import Recipe, { IRecipe } from '../models/recipe.model';

const recipeRouter = express.Router();

recipeRouter.route('/getById').get((req, res) => {
    if (!req.query.id) {
        return res.status(400).json(new CustomError('No id provided'));
    }
    Recipe
        .findById(req.query.id)
        .populate('author')
        .then((recipe: IRecipe | null) => {
            res.status(200).json(recipe);
        })
        .catch((err: CallbackError) => {
            if (err?.name === 'CastError') {
                res.status(400).json(new CustomError('The provided id is not valid'));
            }
            else {
                res.status(500).json(new CustomError('Could not find recipe by id', err));
            }
        });
});

recipeRouter.route('/getRandom').get((req, res) => {
    Recipe
        .count()
        .then((count) => {
            const random = Math.floor(Math.random() * count);

            Recipe
                .findOne()
                .skip(random)
                .populate('author')
                .then((recipe) => {
                    res.status(200).json(recipe);
                })
                .catch((err) => {
                    res.status(500).json(new CustomError('Could not find recipe', err));
                });
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not count total number of recipes', err));
        });
});

recipeRouter.route('/get').get((req, res) => {
    const searchType = req.query.searchType || 'title';
    const searchText = req.query.searchText || '';

    let filter = {};

    let regex = new RegExp('.*');

    try {
        regex = new RegExp(searchText.toString().length > 0 ? searchText.toString() : '.*', 'i');
    } catch (err) {
        return res.status(500).json(new CustomError('Could not create regex', err));
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
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }

    const recipe = new Recipe(req.body);
    
    recipe
        .save()
        .then((recipe: IRecipe) => {
            res.status(200).json(recipe);
        })
        .catch((err) => res.status(500).json(new CustomError('Unable to save item to database', err)));
});

recipeRouter.route('/update').put((req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }
    if (!req.query.id) {
        return res.status(400).json(new CustomError('Document Id not provided'));
    }
    
    Recipe
        .findByIdAndUpdate(req.query.id, req.body, {new: true})
        .then((recipe: IRecipe | null) => {
            if (!recipe) {
                res.status(404).json(new CustomError('Document with provided id not found'));
            }
            else {
                res.status(200).json(recipe);
            }
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find recipe by id or update it', err));
        });
});

recipeRouter.route('/delete').delete((req, res) => {
    if (!req.query.id) {
        return res.status(400).json(new CustomError('Document Id not provided'));
    }
    
    Recipe
        .findByIdAndDelete(req.query.id)
        .then((recipe: IRecipe | null) => {
            if (!recipe) {
                res.status(404).json(new CustomError('Document with provided id not found'));
            }
            else {
                res.status(200).json(recipe);
            }
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find recipe by id or delete it', err));
        });
});

recipeRouter.route('/import').get((req, res) => {
    if (!req.query.url) {
        return res.status(400).json(new CustomError('URL query parameter not provided'));
    }

    const urlString = String(req.query.url);
    let url: URL | null = null;

    try {
        url = new URL(urlString);
    }
    catch {
        return res.status(500).json(new CustomError('URL could not be parsed'));
    }

    const site = integratedSites.find((site) => site.url === url?.hostname);

    if (!site) {
        return res.status(501).json(new CustomError('This site is not integrated yet'));
    }
    
    const recipe = new RecipeIntegration(urlString);

    recipe.populate(site)
        .then(() => {
            if (recipe === null) {
                return res.status(500).json(new CustomError('Recipe integration failed'));
            }
            Recipe.findOne({ url: recipe.url })
                .then((foundRecipe: IRecipe | null) => {
                    if (foundRecipe !== null) {
                        return res.status(400).json(
                            new CustomError('There already exists a recipe imported from this same url')
                        );
                    }
                    if (!req.query.save) {
                        return res.status(200).json(recipe);
                    }
                    const DB_recipe = new Recipe(recipe);
                    DB_recipe
                        .save()
                        .then((recipe: IRecipe) => {
                            res.status(200).json(recipe);
                        })
                        .catch((err) => res.status(500).json(
                            new CustomError('Unable to save item to database', err)
                        ));
                })
                .catch((err) => res.status(500).json(
                    new CustomError('Could not find recipe', err)
                ));
        })
        .catch((err) => res.status(500).json(
            new CustomError('Recipe integration failed. Could not populate provided URL', err)
        ));
});

recipeRouter.route('/integrated-sites').get((req, res) => {
    if (!integratedSites) {
        return res.status(404);
    }

    res.status(200).json(integratedSites);
});

export default recipeRouter;