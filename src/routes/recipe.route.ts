import express from 'express';
import { CallbackError } from 'mongoose';
import Recipe, { IRecipe, RecipeDocument } from '../models/recipe.model';

const recipeRouter = express.Router();

recipeRouter.route('/get').get((req, res) => {
    if (req.query.id) {
        Recipe
            .findById(req.query.id)
            .then((recipe: IRecipe | null) => {
                res.status(200).json(recipe);
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
            .catch((err: CallbackError) => {
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

export default recipeRouter;