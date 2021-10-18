import express from 'express';
import { CustomError } from '../helpers/errors';
import { defaultLimitPerPage } from '../helpers/pagination';
import authMiddleware, { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import User from '../models/user.model';


const userRouter = express.Router();

userRouter.route('/getById').get((req, res) => {
    const userId = req.query.id;

    if (!userId) {
        return res.status(400).json(new CustomError('Week plan Id not provided'));
    }

    User
        .findById(userId)
        .select('-password -__v')
        .then((foundUser) => {
            res.status(200).json(foundUser);
        })
        .catch((err) => {
            if (err?.name === 'CastError') {
                return res.status(400).json(new CustomError('The provided id is not valid'));
            }
            
            res.status(500).json(new CustomError('Could not find recipe by id', err));
        });
});

userRouter.route('/addFavRecipe').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {    
    const recipeId = req.body._id;
    const user = req.decoded!.user;

    if (!recipeId) {
        return res.status(400).json(new CustomError('No recipe provided'));
    }

    User
        .findOneAndUpdate(
            { _id: user._id, favRecipes: { $ne: recipeId}},
            { $push: { favRecipes: recipeId }},
            { new: true }
        )
        .then((updatedUser) => res.status(200).json(updatedUser))
        .catch((err) => res.status(500).json(new CustomError('Could not find user by id or update it', err)));
});

userRouter.route('/removeFavRecipe').put(authMiddleware, (req: RequestWithUserDecodedToken, res) => {
    const recipeId = req.body._id;
    const user = req.decoded!.user;

    if (!recipeId) {
        return res.status(400).json(new CustomError('No recipe provided'));
    }

    User
        .findByIdAndUpdate(
            user._id,
            { $pull: { favRecipes: recipeId }},
            { new: true }
        )
        .then((updatedUser) => res.status(200).json(updatedUser))
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
        .then((foundUser) => {
            if (!foundUser) {
                return res.status(404).json(new CustomError('Document with provided id not found'));
            }
            
            const next = limit !== 0 && foundUser.favRecipes.length === limit + 1;

            if (next) {
                foundUser.favRecipes.pop();
            }

            res.status(200).json({
                result: foundUser.favRecipes,
                next
            });
        })
        .catch((err) => res.status(500).json(new CustomError('Could not find user by id', err)));
});

export default userRouter;