import { CallbackError, Query } from 'mongoose';
import { Request, Response } from 'express';
import { RecipeDocument } from '../models/recipe.model';

const defaultLimitPerPage = 0;

export function paginate(query: Query<any[], any>, req: Request, res: Response): void {
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : defaultLimitPerPage;
    const skip = (page - 1) * limit;
    
    query
        .sort({ _id: 1 })
        .limit(limit === 0 ? limit  : limit + 1)
        .skip(skip)
        .then((recipes: RecipeDocument[]) => {
            const next = recipes.length === limit + 1;

            if (limit !== 0 && next) { 
                recipes.pop();
            }

            res.status(200).json({
                recipes,
                next,
                limit: limit === 0 ? limit  : limit + 1,
                length: recipes.length,
            });
        })
        .catch((err : CallbackError) => {
            res.status(404).send(err);
        });
}