import express from 'express';
import Recipe from '../models/recipe.model';

const recipeRouter = express.Router();

recipeRouter.route('/add').post((req, res) => {
    const recipe = new Recipe(req.body);
    recipe
        .save()
        .then(() => res.status(200).json('Item saved successfully'))
        .catch(() => res.status(400).json('Unable to save item to database'));
});

recipeRouter.route('/get').get((req, res) => {
    Recipe.find((err, recipes) => {
        err ? res.json(err) : res.json(recipes);
    });
});

export default recipeRouter;