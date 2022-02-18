import express from 'express';
import { CallbackError } from 'mongoose';
import { CustomError } from '../helpers/errors';
import { paginate } from '../helpers/pagination';
import { RecipeIntegration } from '../integration';
import Recipe, { IRecipe } from '../models/recipe.model';
import got from 'got';

const recipeRouter = express.Router();

recipeRouter.route('/get').get((req, res) => {
	const searchType = req.query.searchType || 'title';
	const searchText = req.query.searchText || '';

	let filter = {};

	let regex = new RegExp('.*');

	try {
		regex = new RegExp(
			searchText.toString().length > 0 ? searchText.toString() : '.*',
			'i'
		);
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

recipeRouter.route('/getById').get((req, res) => {
	const recipeId = req.query.id;

	if (!recipeId) {
		return res.status(400).json(new CustomError('No id provided'));
	}
	Recipe.findById(recipeId)
		.populate('author')
		.then((foundRecipe) => {
			res.status(200).json(foundRecipe);
		})
		.catch((err: CallbackError) => {
			if (err?.name === 'CastError') {
				return res
					.status(400)
					.json(new CustomError('The provided id is not valid'));
			}

			res.status(500).json(new CustomError('Could not find recipe by id', err));
		});
});

recipeRouter.route('/getRandom').get((req, res) => {
	Recipe.count()
		.then((count) => {
			const random = Math.floor(Math.random() * count);

			Recipe.findOne()
				.skip(random)
				.populate('author')
				.then((foundRecipe) => {
					res.status(200).json(foundRecipe);
				})
				.catch((err) => {
					res.status(500).json(new CustomError('Could not find recipe', err));
				});
		})
		.catch((err) => {
			res
				.status(500)
				.json(new CustomError('Could not count total number of recipes', err));
		});
});

recipeRouter.route('/getByUser').get((req, res) => {
	const userId = req.query.id;

	if (!userId) {
		return res.status(400).json(new CustomError('No user provided'));
	}

	// @ts-ignore
	paginate(Recipe.find({ author: userId }), req, res);
});

recipeRouter.route('/add').post((req, res) => {
	const recipe: IRecipe = req.body;

	if (!recipe || Object.keys(recipe).length === 0) {
		return res.status(400).json(new CustomError('Cannot save empty objects'));
	}

	const recipeDocument = new Recipe(recipe);

	recipeDocument
		.save()
		.then((savedRecipe) => {
			res.status(200).json(savedRecipe);
		})
		.catch((err) =>
			res
				.status(500)
				.json(new CustomError('Unable to save item to database', err))
		);
});

recipeRouter.route('/update').put((req, res) => {
	const recipeId = req.query.id;
	const recipe: IRecipe = req.body;

	if (!recipe || Object.keys(recipe).length === 0) {
		return res.status(400).json(new CustomError('Cannot save empty objects'));
	}
	if (!recipeId) {
		return res.status(400).json(new CustomError('Document Id not provided'));
	}

	Recipe.findByIdAndUpdate(recipeId, recipe, { new: true })
		.then((updatedRecipe) => {
			if (!updatedRecipe) {
				return res
					.status(404)
					.json(new CustomError('Document with provided id not found'));
			}

			res.status(200).json(updatedRecipe);
		})
		.catch((err) => {
			res
				.status(500)
				.json(new CustomError('Could not find recipe by id or update it', err));
		});
});

recipeRouter.route('/delete').delete((req, res) => {
	const recipeId = req.query.id;

	if (!recipeId) {
		return res.status(400).json(new CustomError('Document Id not provided'));
	}

	Recipe.findByIdAndDelete(recipeId)
		.then((deletedRecipe) => {
			if (!deletedRecipe) {
				return res
					.status(404)
					.json(new CustomError('Document with provided id not found'));
			}

			res.status(200).json(deletedRecipe);
		})
		.catch((err) => {
			res
				.status(500)
				.json(new CustomError('Could not find recipe by id or delete it', err));
		});
});

recipeRouter.route('/import').get(async (req, res) => {
	if (!req.query.url) {
		return res
			.status(400)
			.json(new CustomError('URL query parameter not provided'));
	}

	const urlString = String(req.query.url);

	const recipe = new RecipeIntegration(urlString);

	recipe
		.populate()
		.then(() => {
			if (recipe === null) {
				return res
					.status(500)
					.json(new CustomError('Recipe integration failed'));
			}
			Recipe.findOne({ url: recipe.url })
				.then((foundRecipe) => {
					if (foundRecipe !== null) {
						return res
							.status(400)
							.json(
								new CustomError(
									'There already exists a recipe imported from this same url'
								)
							);
					}
					if (!req.query.save) {
						return res.status(200).json(recipe);
					}
					const DB_recipe = new Recipe(recipe);
					DB_recipe.save()
						.then((recipe) => {
							res.status(200).json(recipe);
						})
						.catch((err) =>
							res
								.status(500)
								.json(new CustomError('Unable to save item to database', err))
						);
				})
				.catch((err) =>
					res.status(500).json(new CustomError('Could not find recipe', err))
				);
		})
		.catch((err) =>
			res.status(500).json(new CustomError('Recipe integration failed', err))
		);
});

recipeRouter.route('/search').get((req, res) => {
	got(
		'https://api.edamam.com/api/recipes/v2?type=public&q=*&app_id=c6f57a4d&app_key=e45745fd8d51ccccb947a60c2146e13c&health=dairy-free&cuisineType=American&mealType=Breakfast&dishType=desserts'
	).then((x) => res.status(200).send(x));
});

// @deprecated
recipeRouter.route('/integrated-sites').get((req, res) => {
	res.status(500).json(new CustomError('Endpoint deprecated'));
});

export default recipeRouter;
