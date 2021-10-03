import express from 'express';
import { compare, hash } from 'bcryptjs';
import User, { IUser } from '../models/user.model';
import { sign, verify } from 'jsonwebtoken';

const authRouter = express.Router();

authRouter.route('/signup').post((req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(500).send('Cannot save empty objects');
        return;
    }

    if (!req.body.username || !req.body.email || !req.body.password) {
        res.status(500).send('User has missing information for sign up');
        return;
    }

    // TODO: use middlewares
    User
        .findOne({ username: req.body.username })
        .then((foundUser: IUser | null) => {
            if (foundUser !== null) {
                res.status(300).send('This username already exists');
                return;
            }
            User
                .findOne({ email: req.body.email })
                .then(async (foundUser: IUser | null) => {
                    if (foundUser !== null) {
                        res.status(300).send('This email is already being used by another user');
                        return;
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
                        .catch((err) => res.status(400).send(err));
                })
                .catch((err) => res.status(500).send(err));
        })
        .catch((err) => res.status(500).send(err));
});

authRouter.route('/signin').post((req, res) => {
    if (req.body.token) {
        const token = req.body.token;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        verify(token, process.env.JWTSECRET!, (err: any, decoded: any) => {
            if (err) {
                res.status(500).send('Unable to verify token');
                return;
            }

            if (decoded.exp <= Date.now() / 1000) {
                res.status(401).json('Token expired');
                return;
            }
    
            User
                .findById(decoded.user._id)
                .then((user: IUser | null) => {
                    if (user === null) {
                        res.status(404);
                        return;
                    }

                    // @ts-ignore
                    res.status(200).json({...user._doc, password: undefined});
                })
                .catch((err) => {
                    res.status(500).send(err);
                });
        });
    } else {
        User
            .findOne({ username: req.body.username })
            .then(async (user: IUser | null) => {
                if (user === null) {
                    res.status(404).send('User not found');
                    return;
                }
                
                const isValidPassword = await compare(
                    req.body.password,
                    user.password
                );

                if (!isValidPassword) {
                    res.status(400).send('Invalid password');
                    return;
                }

                sign({ user }, process.env.JWTSECRET!, { expiresIn: 31556926 }, (err, token) => {
                    if (err) {
                        res.status(500).send(err);
                        return;
                    }

                    res.status(200).json({
                        // @ts-ignore
                        user: {...user._doc, password:undefined},
                        token
                    });
                });
            })
            .catch((err) => res.status(500).send(err));
    }
});

authRouter.route('/restricted').get((req, res) => {
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

        res.status(200).json(decoded);
    });
});

export default authRouter;