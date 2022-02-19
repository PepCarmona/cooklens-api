import { CallbackError, Query } from 'mongoose';
import { Request, Response } from 'express';
import { CustomError } from './errors';

export interface PaginatedResult<T> {
	result: T[];
	next: string | null;
	prev: string | null;
}
export const defaultLimitPerPage = 20;

export function paginate<T>(
	query: Query<T[], any>,
	path: URL,
	req: Request,
	res: Response
): void {
	const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
	const limit = req.query.limit
		? parseInt(req.query.limit.toString())
		: defaultLimitPerPage;
	const skip = (page - 1) * limit;

	query
		.sort({ _id: 1 })
		.limit(limit === 0 ? limit : limit + 1)
		.skip(skip)
		.then((result: T[]) => {
			const isNext = limit !== 0 && result.length === limit + 1;

			if (isNext) {
				result.pop();
			}

			const nextUrl = new URL(path);
			nextUrl.searchParams.append('page', (page + 1).toString());

			if (limit !== defaultLimitPerPage) {
				nextUrl.searchParams.append('limit', limit.toString());
			}

			const prevUrl = new URL(path);
			prevUrl.searchParams.append('page', (page - 1).toString());

			if (limit !== defaultLimitPerPage) {
				prevUrl.searchParams.append('limit', limit.toString());
			}

			res.status(200).json({
				result,
				next: isNext ? nextUrl : null,
				prev: page > 1 ? prevUrl : null,
			} as PaginatedResult<T>);
		})
		.catch((err: CallbackError) => {
			res.status(500).send(new CustomError('Could not paginate result', err));
		});
}

export function paginateList<T>(
	list: T[],
	page: number,
	limit = defaultLimitPerPage
): PaginatedResult<T> {
	const skip = (page - 1) * limit;

	const result = list.slice(skip, limit !== 0 ? skip + limit : undefined);
	const isNext = limit !== 0 && !!list[skip + limit];

	return {
		result,
		next: isNext ? '' : null,
		prev: null,
	};
}
