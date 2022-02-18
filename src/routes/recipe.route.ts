import express from 'express';
import { CallbackError } from 'mongoose';
import { CustomError } from '../helpers/errors';
import { paginate } from '../helpers/pagination';
import { MetadataRecipeIntegration } from '../integration/metadata';
import Recipe, { IRecipe } from '../models/recipe.model';
import got from 'got';
import dotenv from 'dotenv';
import { compareStringsContent } from '../helpers/comparison';

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

	const recipe = new MetadataRecipeIntegration(urlString);

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

recipeRouter.route('/explore').get((req, res) => {
	if (process.env.NODE_ENV !== 'production') {
		dotenv.config();
	}

	const allowedHealthTypes = [
		'alcohol-cocktail',
		'alcohol-free',
		'celery-free',
		'crustacean-free',
		'dairy-free',
		'DASH',
		'egg-free',
		'fish-free',
		'fodmap-free',
		'gluten-free',
		'immuno-supportive',
		'keto-friendly',
		'kidney-friendly',
		'kosher',
		'low-fat-abs',
		'low-potassium',
		'low-sugar',
		'lupine-free',
		'Mediterranean',
		'mollusk-free',
		'mustard-free',
		'no-oil-added',
		'paleo',
		'peanut-free',
		'pescatarian',
		'pork-free',
		'red-meat-free',
		'sesame-free',
		'shellfish-free',
		'soy-free',
		'sugar-conscious',
		'sulfite-free',
		'tree-nut-free',
		'vegan',
		'vegetarian',
		'wheat-free',
	];

	const allowedCuisineTypes = [
		'American',
		'Asian',
		'British',
		'Caribbean',
		'Central Europe',
		'Chinese',
		'Eastern Europe',
		'French',
		'Indian',
		'Italian',
		'Japanese',
		'Kosher',
		'Mediterranean',
		'Mexican',
		'Middle Eastern',
		'Nordic',
		'South American',
		'South East Asian',
	];

	const allowedMealTypes = ['Breakfast', 'Dinner', 'Lunch', 'Snack', 'Teatime'];

	const allowedDishTypes = [
		'Biscuits and cookies',
		'Bread',
		'Cereals',
		'Condiments and sauces',
		'Desserts',
		'Drinks',
		'Main course',
		'Pancake',
		'Preps',
		'Preserve',
		'Salad',
		'Sandwiches',
		'Side dish',
		'Soup',
		'Starter',
		'Sweets',
	];

	const params = {
		query: req.query.query?.toString() ?? '*',
		health: req.query.health?.toString(),
		cuisine: req.query.cuisine?.toString(),
		meal: req.query.meal?.toString(),
		dish: req.query.dish?.toString(),
	};

	const options: Record<string, any> = {
		url: 'https://api.edamam.com/api/recipes/v2',
		searchParams: {
			type: 'public',
			app_id: process.env.EDAMAM_SEARCH_ID,
			app_key: process.env.EDAMAM_SEARCH_KEY,
			q: params.query,
		},
	};

	if (params.health) {
		if (
			!allowedHealthTypes.find((x) => compareStringsContent(x, params.health!))
		) {
			return res.status(400).json(new CustomError('Not allowed health type'));
		}

		options.searchParams.health = params.health;
	}

	if (params.cuisine) {
		if (
			!allowedCuisineTypes.find((x) =>
				compareStringsContent(x, params.cuisine!)
			)
		) {
			return res.status(400).json(new CustomError('Not allowed cuisine type'));
		}

		options.searchParams.cuisineType = params.cuisine;
	}

	if (params.meal) {
		if (!allowedMealTypes.find((x) => compareStringsContent(x, params.meal!))) {
			return res.status(400).json(new CustomError('Not allowed meal type'));
		}

		options.searchParams.mealType = params.meal;
	}

	if (params.dish) {
		if (!allowedDishTypes.find((x) => compareStringsContent(x, params.dish!))) {
			return res.status(400).json(new CustomError('Not allowed dish type'));
		}

		options.searchParams.dishType = params.dish;
	}

	got(options)
		.json()
		.then((x) => res.status(200).json(x));
});

// @deprecated
recipeRouter.route('/integrated-sites').get((req, res) => {
	res.status(500).json(new CustomError('Endpoint deprecated'));
});

export default recipeRouter;
