import express from 'express';
import { CustomError } from '../helpers/errors';
import authMiddleware, { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import MealPlan from '../models/mealPlan.model';

const mealPlanRouter = express.Router();

mealPlanRouter.route('/getMealPlan').get(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const user = req.decoded!.user;

    MealPlan
        .findOne({ users: user._id })
        .then((foundMealPlan) => {
            if (foundMealPlan !== null) {
                return res.status(200).json(foundMealPlan);
            } 

            const mealPlanDocument = new MealPlan({users: [user._id]});
            mealPlanDocument
                .save()
                .then((savedMealPlan) => {
                    res.status(200).json(savedMealPlan);
                })
                .catch((err) => res.status(500).json(new CustomError('Could not save week plan', err)));
        })
        .catch((err) => res.status(500).json(new CustomError('Could not find week plan', err)));
});

mealPlanRouter.route('/updateMealPlan').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const mealPlanId = req.query.id;
    const mealPlan = req.body;

    if (!mealPlan || Object.keys(mealPlan).length === 0) {
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }

    MealPlan
        .findOneAndUpdate(
            { _id: mealPlanId }, mealPlan, { new: true})
        .then((updatedMealPlan) => {
            if (!updatedMealPlan) {
                return res.status(404).json(
                    new CustomError('Document with provided id not found or not enough permissions to update it')
                );
            }

            res.status(200).json(updatedMealPlan);
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find week plan by id or update it', err));
        });
});

export default mealPlanRouter;