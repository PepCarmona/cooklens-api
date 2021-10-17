import express from 'express';
import { CustomError } from '../helpers/errors';
import { defaultLimitPerPage } from '../helpers/pagination';
import authMiddleware, { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import User, { IUser } from '../models/user.model';


const userRouter = express.Router();

userRouter.route('/getById').get((req, res) => {
    if (!req.query.id) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    User
        .findById(req.query.id)
        .select('-password -__v')
        .then((user: IUser | null) => {
            res.status(200).json(user);
        })
        .catch((err) => {
            if (err?.name === 'CastError') {
                res.status(400).json(new CustomError('The provided id is not valid'));
            }
            else {
                res.status(500).json(new CustomError('Could not find recipe by id', err));
            }
        });
});

userRouter.route('/addFavRecipe').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    if (!req.body._id) {
        return res.status(400).json(new CustomError('No recipe provided'));
    }

    const user = req.decoded!.user;
    User
        .findByIdAndUpdate(
            user._id,
            { $push: { favRecipes: req.body._id }},
            { new: true }
        )
        .then((user: IUser | null) => res.status(200).json(user))
        .catch((err) => res.status(500).json(new CustomError('Could not find user by id or update it', err)));
});

userRouter.route('/removeFavRecipe').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    if (!req.body._id) {
        return res.status(400).json(new CustomError('No recipe provided'));
    }

    const user = req.decoded!.user;
    User
        .findByIdAndUpdate(
            user._id,
            { $pull: { favRecipes: req.body._id }},
            { new: true }
        )
        .then((user: IUser | null) => res.status(200).json(user))
        .catch((err) => res.status(500).json(new CustomError('Could not find user by id or update it', err)));
});

userRouter.route('/getFavRecipes').get(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : defaultLimitPerPage;
    const skip = (page - 1) * limit;
    
    const user = req.decoded!.user;
    User
        .findById(user._id)
        .select({ 'favRecipes': { $slice: limit !== 0 ? [skip, skip + limit + 1] : Number.MAX_VALUE}})
        .populate('favRecipes')
        .then((user: IUser | null) => {
            if (!user) {
                return res.status(404).json(new CustomError('Document with provided id not found'));
            }
            
            const next = limit !== 0 && user.favRecipes.length === limit + 1;

            if (next) {
                user.favRecipes.pop();
            }

            res.status(200).json({
                result: user.favRecipes,
                next
            });
        })
        .catch((err) => res.status(500).json(new CustomError('Could not find user by id', err)));
});

export default userRouter;