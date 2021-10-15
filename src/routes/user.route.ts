import express from 'express';
import { CustomError } from '../helpers/errors';
import { defaultLimitPerPage, paginateList } from '../helpers/pagination';
import { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import { IRecipe } from '../models/recipe.model';
import User, { IUser } from '../models/user.model';


const userRouter = express.Router();

userRouter.route('/addFavRecipe').put((req: RequestWithUserDecodedToken, res) => {
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

userRouter.route('/removeFavRecipe').put((req: RequestWithUserDecodedToken, res) => {
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

userRouter.route('/getFavRecipes').get((req: RequestWithUserDecodedToken, res) => {
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : defaultLimitPerPage;
    
    const user = req.decoded!.user;
    User
        .findById(user._id)
        .populate('favRecipes')
        .then((user: IUser | null) => {
            if (!user) {
                return res.status(404).json(new CustomError('Document with provided id not found'));
            }

            const favRecipes = paginateList(user.favRecipes as IRecipe[], page, limit);

            res.status(200).json(favRecipes);
        })
        .catch((err) => res.status(500).json(new CustomError('Could not find user by id', err)));
});

export default userRouter;