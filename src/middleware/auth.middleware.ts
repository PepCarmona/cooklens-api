import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { IUserWithId } from '../models/user.model';

interface UserDecodedToken {
    user: IUserWithId;
    exp: number;
}

export interface RequestWithUserDecodedToken extends Request {
    decoded?: UserDecodedToken;
}

export default function authMiddleware(req: RequestWithUserDecodedToken, res: Response, next: NextFunction): void {
    const token = req.headers['x-access-token'] as string | undefined;

    if (!token) {
        res.status(400).send('No token provided');
        return;
    }

    verify(token, process.env.JWTSECRET!, (err, decoded) => {
        if (err) {
            res.status(500).send('Unable to verify token');
            return;
        }

        if (!decoded) {
            res.status(500).send('Empty token');
            return;
        }

        req.decoded = decoded as UserDecodedToken;
        next();
    });
}