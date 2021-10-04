import express from 'express';
import { defaultLimitPerPage, paginateList } from '../helpers/pagination';
import { RequestWithUserDecodedToken } from '../middleware/auth.middleware';
import { IRecipe } from '../models/recipe.model';
import User, { IUser } from '../models/user.model';


const userRouter = express.Router();

userRouter.route('/addFavRecipe').put((req: RequestWithUserDecodedToken, res) => {
    if (!req.body._id) {
        res.status(500).send('No recipe provided');
        return;
    }

    const user = req.decoded!.user;
    User
        .findByIdAndUpdate(
            user._id,
            { $push: { favRecipes: req.body._id }},
            { new: true }
        )
        .then((user: IUser | null) => res.status(200).json(user))
        .catch((err) => res.status(500).send(err));
});

userRouter.route('/removeFavRecipe').put((req: RequestWithUserDecodedToken, res) => {
    if (!req.body._id) {
        res.status(500).send('No recipe provided');
        return;
    }

    const user = req.decoded!.user;
    User
        .findByIdAndUpdate(
            user._id,
            { $pull: { favRecipes: req.body._id }},
            { new: true }
        )
        .then((user: IUser | null) => res.status(200).json(user))
        .catch((err) => res.status(500).send(err));
});

userRouter.route('/getFavRecipes').get((req: RequestWithUserDecodedToken, res) => {
    const user = req.decoded!.user;

    if (req.query.onlyIds) {
        User
            .findById(user._id)
            .then((user: IUser | null) => {
                if (!user) {
                    res.status(404).send('Document with provided id not found');
                    return;
                }

                res.status(200).json(user.favRecipes);
            })
            .catch((err) => res.status(500).send(err));
    } else {
        const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : defaultLimitPerPage;

        User
            .findById(user._id)
            .populate('favRecipes')
            .then((user: IUser | null) => {
                if (!user) {
                    res.status(404).send('Document with provided id not found');
                    return;
                }

                const favRecipes = paginateList(user.favRecipes as IRecipe[], page, limit);

                res.status(200).json(favRecipes);
            })
            .catch((err) => res.status(500).send(err));
    }
});

export default userRouter;