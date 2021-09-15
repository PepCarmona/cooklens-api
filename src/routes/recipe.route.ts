import express from 'express';
import { CallbackError } from 'mongoose';
import { URL } from 'url';
import { AllRecipesIntegration } from '../integration/allRecipes';
import { integratedSites, RecipeIntegration } from '../integration/config';
import Recipe, { IRecipe, RecipeDocument } from '../models/recipe.model';

const recipeRouter = express.Router();

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
                    res.status(404).json(err);
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
                        res.status(404).json(err);
                    });
            })
            .catch((err) => {
                res.status(404).json(err);
            });
    }
    else {
        Recipe
            .find()
            .then((recipes: RecipeDocument[]) => {
                res.status(200).json(recipes);
            })
            .catch((err) => {
                res.status(404).json(err);
            });
    }
});

recipeRouter.route('/add').post((req, res) => {
    const recipe = new Recipe(req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(404).send('Cannot save empty objects');
    }
    else {
        recipe
            .save()
            .then((recipe: IRecipe) => {
                res.status(200).json(recipe);
            })
            .catch(() => res.status(400).send('Unable to save item to database'));
    }
});

recipeRouter.route('/update').put((req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(404).send('Cannot save empty objects');
    }
    else if (!req.query.id) {
        res.status(404).send('Document Id not provided');
    }
    else {
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
                res.status(404).json(err);
            });
    }
});

recipeRouter.route('/delete').delete((req, res) => {
    if (!req.query.id) {
        res.status(404).send('Document Id not provided');
    }
    else {
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
                res.status(404).json(err);
            });
    }
});

recipeRouter.route('/import').get((req, res) => {
    if (!req.query.url) {
        res.status(400).send('URL query parameter not provided');
        return;
    }

    const urlString = String(req.query.url);
    const url = new URL(urlString);
    if (!Object.values(integratedSites).includes(url.hostname)) {
        res.status(400).send('This site is not integrated yet');
        return;
    }
    
    let recipe: RecipeIntegration | null = null;
    switch (url.hostname) {
    case integratedSites.allRecipes:
        if (url.pathname.split('/')[1] !== 'recipe') {
            res.status(400).send('This page does not contain a suported format recipe. ('+url.pathname.split('/')+')');
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
                        const DB_recipe = new Recipe(recipe);
                        DB_recipe
                            .save()
                            .then((recipe: IRecipe) => {
                                res.status(200).json(recipe);
                            })
                            .catch(() => res.status(400).send('Unable to save item to database'));
                    })
                    .catch((err) => res.status(501).json(err));
            })
            .catch((err) => res.status(502).json({
                queryUrl: req.query.url,
                urlString,
                recipe,
                err
            }));
        break;
    default:
        res.status(400).send('This site is not integrated yet');
    }
});

export default recipeRouter;