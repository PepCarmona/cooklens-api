import express from 'express';
import { compare, hash } from 'bcryptjs';
import User, { IUser } from '../models/user.model';
import { sign, verify } from 'jsonwebtoken';
import { CustomError } from '../helpers/errors';

const authRouter = express.Router();

authRouter.route('/signup').post((req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json(new CustomError('Cannot save empty objects'));
    }

    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json(new CustomError('User has missing information for sign up'));
    }

    // TODO: use middlewares
    User
        .findOne({ username: req.body.username })
        .then((foundUser: IUser | null) => {
            if (foundUser !== null) {
                return res.status(400).json(new CustomError('This username already exists'));
            }
            User
                .findOne({ email: req.body.email })
                .then(async (foundUser: IUser | null) => {
                    if (foundUser !== null) {
                        return res.status(400).json(
                            new CustomError('This email is already being used by another user')
                        );
                    }

                    const user = new User({
                        ...req.body,
                        password: await hash(req.body.password, 8)
                    });
                
                    user
                        .save()
                        .then((user: IUser) => {
                            sign({ user }, process.env.JWTSECRET!, { expiresIn: 31556926 }, (err, token) => {
                                res.status(200).json({
                                    // @ts-ignore
                                    user: {...user._doc, password:undefined},
                                    token
                                });
                            });
                        })
                        .catch((err) => res.status(500).json(
                            new CustomError('Could not save user to database', err)
                        ));
                })
                .catch((err) => res.status(500).json(
                    new CustomError('Could not find user by email', err)
                ));
        })
        .catch((err) => res.status(500).json(new CustomError('Could not find user by username', err)));
});

authRouter.route('/signin').post((req, res) => {
    if (req.body.token) {
        const token = req.body.token;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        verify(token, process.env.JWTSECRET!, (err: any, decoded: any) => {
            if (err) {
                return res.status(500).json(new CustomError('Unable to verify token'));
            }

            if (decoded.exp <= Date.now() / 1000) {
                return res.status(400).json(new CustomError('Token expired'));
            }
    
            User
                .findById(decoded.user._id)
                .then((user: IUser | null) => {
                    if (user === null) {
                        return res.status(404);
                    }

                    // @ts-ignore
                    res.status(200).json({...user._doc, password: undefined});
                })
                .catch((err) => {
                    res.status(500).json(new CustomError('Could not find user by id', err));
                });
        });
    } else {
        User
            .findOne({ username: req.body.username })
            .then(async (user: IUser | null) => {
                if (user === null) {
                    return res.status(404).json(new CustomError('User not found'));
                }
                
                const isValidPassword = await compare(
                    req.body.password,
                    user.password
                );

                if (!isValidPassword) {
                    return res.status(400).json(new CustomError('Invalid password'));
                }

                sign({ user }, process.env.JWTSECRET!, { expiresIn: 31556926 }, (err, token) => {
                    if (err) {
                        return res.status(500).json(new CustomError('Could not sign token', err));
                    }

                    res.status(200).json({
                        // @ts-ignore
                        user: {...user._doc, password:undefined},
                        token
                    });
                });
            })
            .catch((err) => res.status(500).json(new CustomError('Could not find user by username', err)));
    }
});

authRouter.route('/restricted').get((req, res) => {
    const token = req.headers['x-access-token'] as string | undefined;

    if (!token) {
        return res.status(400).json(new CustomError('No token provided'));
    }

    verify(token, process.env.JWTSECRET!, (err, decoded) => {
        if (err) {
            return res.status(500).json(new CustomError('Unable to verify token'));
        }

        res.status(200).json(decoded);
    });
});

export default authRouter;