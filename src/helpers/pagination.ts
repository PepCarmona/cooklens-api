import { CallbackError, Query } from 'mongoose';
import { Request, Response } from 'express';

export const defaultLimitPerPage = 0;

export function paginate<T>(query: Query<T[], any>, req: Request, res: Response): void {
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : defaultLimitPerPage;
    const skip = (page - 1) * limit;
    
    query
        .sort({ _id: 1 })
        .limit(limit === 0 ? limit  : limit + 1)
        .skip(skip)
        .then((result: T[]) => {
            const next = result.length === limit + 1;

            if (limit !== 0 && next) { 
                result.pop();
            }

            res.status(200).json({
                result,
                next,
            });
        })
        .catch((err : CallbackError) => {
            res.status(404).send(err);
        });
}

export function paginateList<T>(list: T[], page: number, limit = defaultLimitPerPage): 
{
    result: T[],
    next: boolean,
}
{
    const skip = (page - 1) * limit;

    const result = list.slice(skip, limit !== 0 ? skip + limit : undefined);
    const next = limit !== 0 && !!list[skip + limit];

    return {
        result,
        next,
    };
}