import express from 'express';
import { compare, hash } from 'bcryptjs';
import User, { IUser } from '../models/user.model';

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

    // TODO: use next() instead of nesting Promise then
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
                            res.status(200).json(user);
                        })
                        .catch((err) => res.status(400).send(err));
                })
                .catch((err) => res.status(500).send(err));
        })
        .catch((err) => res.status(500).send(err));
});

authRouter.route('/signin').post((req, res) => {
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

            res.status(200).json(user);
        })
        .catch((err) => res.status(500).send(err));
});

authRouter.route('/admin').get((req, res) => {
    res.send('Restricted to only admin');
});

export default authRouter;