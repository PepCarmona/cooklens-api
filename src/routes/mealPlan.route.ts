import express from 'express';
import { CustomError } from '../helpers/errors';
import { paginate } from '../helpers/pagination';
import authMiddleware, { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import WeeklyPlan from '../models/mealPlan.models';
import User from '../models/user.model';

const mealPlanRouter = express.Router();

mealPlanRouter.route('/getAll').get((req, res) => {
    paginate(WeeklyPlan.find(), req, res);
});

mealPlanRouter.route('/createWeekPlan').post(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }

    const user = req.decoded!.user;

    const weekPlan = new WeeklyPlan(req.body);
    weekPlan.author = user._id;
    

    weekPlan
        .save()
        .then((weekplan) => {
            User
                .findByIdAndUpdate(
                    user._id,
                    { $push: { mealPlans: weekPlan._id }},
                    { new: true }
                )
                .then(() => res.status(200).json(weekplan))
                .catch((err) => res.status(500).json(new CustomError('Could not find user by id or update it', err)));
        })
        .catch((err) => res.status(500).json(new CustomError('Could not save week plan', err)));
});

mealPlanRouter.route('/deleteWeekPlan').delete(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    if (!req.query.id) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    const user = req.decoded!.user;

    WeeklyPlan
        .findOneAndDelete({
            _id: req.query.id,
            author: user._id
        })
        .then((weekPlan) => {
            if (!weekPlan) {
                return res.status(404).json(
                    new CustomError('Week plan with provided id not found or not enough permissions to remove it')
                );
            }

            User
                .updateMany(
                    { mealPlans: weekPlan._id },
                    { $pull: { mealPlans: weekPlan._id } }
                )
                .then(() => res.status(200).json(weekPlan))
                .catch((err) => res.status(500).json(
                    new CustomError('Could not remove week plan from subscribed users', err)
                ));
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find week plan by id or delete it', err));
        });
});

mealPlanRouter.route('/subscribeToWeekPlan').post(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const { id } = req.query;
    const user = req.decoded!.user;

    if (!id) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    WeeklyPlan
        .findById(id)
        .then((weekPlan) => {
            if (!weekPlan) {
                return res.status(404).json(new CustomError('Could not find week plan with provided id'));
            }

            User
                .findByIdAndUpdate(
                    user._id,
                    { $push: { mealPlans: id }},
                    { new: true }
                )
                .then((user) => res.status(200).json(user))
                .catch((err) => res.status(500).json(
                    new CustomError('Could not find user by id or update it', err)
                ));
        });
});

mealPlanRouter.route('/unsubscribeToWeekPlan').post(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const { id } = req.query;
    const user = req.decoded!.user;

    if (!id) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    WeeklyPlan
        .findById(id)
        .then((weekPlan) => {
            if (!weekPlan) {
                return res.status(404).json(new CustomError('Could not find week plan with provided id'));
            }

            User
                .findByIdAndUpdate(
                    user._id,
                    { $pull: { mealPlans: id }},
                    { new: true }
                )
                .then((user) => res.status(200).json(user))
                .catch((err) => res.status(500).json(
                    new CustomError('Could not find user by id or update it', err)
                ));
        });
});

export default mealPlanRouter;