import express from 'express';
import { CustomError } from '../helpers/errors';
import { paginate } from '../helpers/pagination';
import authMiddleware, { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import WeeklyPlan, { IWeeklyPlan } from '../models/weekPlan.models';
import User from '../models/user.model';

const weekPlanRouter = express.Router();

weekPlanRouter.route('/getAll').get((req, res) => {
    paginate(WeeklyPlan.find(), req, res);
});

weekPlanRouter.route('/getById').get((req, res) => {
    const weekPlanId = req.query.id;

    if (!weekPlanId) {
        return res.status(400).json(new CustomError('No id provided'));
    }

    WeeklyPlan
        .findById(weekPlanId)
        .populate('dailyPlans.lunch')
        .populate('dailyPlans.dinner')
        .then((foundWeekPlan) => {
            res.status(200).json(foundWeekPlan);
        })
        .catch((err) => {
            if (err?.name === 'CastError') {
                return res.status(400).json(new CustomError('The provided id is not valid'));
            }

            res.status(500).json(new CustomError('Could not find recipe by id', err));
        });
});

weekPlanRouter.route('/getMyWeekPlans').get(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const user = req.decoded!.user;

    WeeklyPlan
        .find({ author: user._id })
        .populate('dailyPlans.lunch')
        .populate('dailyPlans.dinner')
        .then((weekPlans) => {
            res.status(200).json(weekPlans);
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find weekPlans by user', err));
        });
});

weekPlanRouter.route('/createWeekPlan').post(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const weekPlan: IWeeklyPlan = req.body;
    const user = req.decoded!.user;

    if (!weekPlan || Object.keys(weekPlan).length === 0) {
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }

    weekPlan.author = user._id;

    // @ts-ignore
    if (!weekPlan.dailyPlans || weekPlan.dailyPlans.length === 0) {
        weekPlan.dailyPlans = [{}, {}, {}, {}, {}, {}, {}];
    }

    const weekPlanDocument = new WeeklyPlan(weekPlan);

    weekPlanDocument
        .save()
        .then((savedWeekPlan) => {
            User
                .findByIdAndUpdate(
                    user._id,
                    { $push: { weekPlans: savedWeekPlan._id }},
                    { new: true }
                )
                .then(() => res.status(200).json(savedWeekPlan))
                .catch((err) => res.status(500).json(new CustomError('Could not find user by id or update it', err)));
        })
        .catch((err) => res.status(500).json(new CustomError('Could not save week plan', err)));
});

weekPlanRouter.route('/updateWeekPlan').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const weekPlanId = req.query.id;
    const weekPlan: IWeeklyPlan = req.body;
    const user = req.decoded!.user;

    if (!weekPlan || Object.keys(weekPlan).length === 0) {
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }

    WeeklyPlan
        .findOneAndUpdate(
            { _id: weekPlanId, author: user }, weekPlan, { new: true })
        .populate('dailyPlans.lunch')
        .populate('dailyPlans.dinner')
        .then((updatedWeekPlan) => {
            if (!updatedWeekPlan) {
                return res.status(404).json(
                    new CustomError('Document with provided id not found or not enough permissions to update it')
                );
            }

            res.status(200).json(updatedWeekPlan);
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find week plan by id or update it', err));
        });
});

weekPlanRouter.route('/deleteWeekPlan').delete(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const weekPlanId = req.query.id;
    const user = req.decoded!.user;

    if (!weekPlanId) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    WeeklyPlan
        .findOneAndDelete({
            _id: weekPlanId,
            author: user
        })
        .then((deletedWeekPlan) => {
            if (!deletedWeekPlan) {
                return res.status(404).json(
                    new CustomError('Week plan with provided id not found or not enough permissions to remove it')
                );
            }

            User
                .updateMany(
                    { weekPlans: deletedWeekPlan._id },
                    { $pull: { weekPlans: deletedWeekPlan._id } }
                )
                .then(() => res.status(200).json(deletedWeekPlan))
                .catch((err) => res.status(500).json(
                    new CustomError('Could not remove week plan from subscribed users', err)
                ));
        })
        .catch((err) => {
            res.status(500).json(new CustomError('Could not find week plan by id or delete it', err));
        });
});

weekPlanRouter.route('/subscribeToWeekPlan').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const weekPlanId = req.body._id;
    const user = req.decoded!.user;

    if (!weekPlanId) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    User
        .findOneAndUpdate(
            { _id: user._id, weekPlans: { $ne: weekPlanId }},
            { $push: { weekPlans: weekPlanId }},
            { new: true }
        )
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(400).json(
                    new CustomError('Current user is already subscribed to this week plan')
                );
            }

            res.status(200).json(updatedUser);
        })
        .catch((err) => res.status(500).json(
            new CustomError('Could not find user by id or update it', err)
        ));
});

weekPlanRouter.route('/unsubscribeToWeekPlan').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const weekPlanId = req.body._id;
    const user = req.decoded!.user;

    if (!weekPlanId) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    User
        .findByIdAndUpdate(
            user._id,
            { $pull: { weekPlans: weekPlanId }},
            { new: true }
        )
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(404).json(
                    new CustomError('Could not find user by id')
                );
            }

            res.status(200).json(updatedUser);
        })
        .catch((err) => res.status(500).json(
            new CustomError('Could not find user by id or update it', err)
        ));
});

export default weekPlanRouter;