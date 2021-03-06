import express from 'express';
import { compare, hash } from 'bcryptjs';
import User, { SigninForm, SignupForm } from '../models/user.model';
import { sign, verify } from 'jsonwebtoken';
import { CustomError } from '../helpers/errors';
import { sendConfirmationMail } from '../helpers/mail';

const authRouter = express.Router();

authRouter.route('/signup').post((req, res) => {
	const signupForm: SignupForm = req.body.user;

	if (!signupForm || Object.keys(signupForm).length === 0) {
		return res.status(400).json(new CustomError('Cannot save empty objects'));
	}

	if (!signupForm.username || !signupForm.email || !signupForm.password) {
		return res
			.status(400)
			.json(new CustomError('User has missing information for sign up'));
	}

	// TODO: use middlewares
	User.findOne({ username: signupForm.username })
		.then((foundUserByUsername) => {
			if (foundUserByUsername !== null) {
				return res
					.status(400)
					.json(new CustomError('This username already exists'));
			}
			User.findOne({ email: signupForm.email })
				.then(async (foundUser) => {
					if (foundUser !== null) {
						return res
							.status(400)
							.json(
								new CustomError(
									'This email is already being used by another user'
								)
							);
					}

					const confirmationCode = sign(
						{ email: signupForm.email },
						process.env.JWTSECRET!
					);

					const user = new User({
						...signupForm,
						password: await hash(signupForm.password, 8),
						confirmationCode,
					});

					user
						.save()
						.then((savedUser) => {
							sendConfirmationMail(savedUser)
								.then(() =>
									sign(
										{ savedUser },
										process.env.JWTSECRET!,
										{ expiresIn: 31556926 },
										(err, token) => {
											res.status(200).json({
												// @ts-ignore
												user: { ...savedUser._doc, password: undefined },
												token,
											});
										}
									)
								)
								.catch((err) =>
									res
										.status(400)
										.json(
											new CustomError('Error sending confirmation mail', err)
										)
								);
						})
						.catch((err) =>
							res
								.status(500)
								.json(new CustomError('Could not save user to database', err))
						);
				})
				.catch((err) =>
					res
						.status(500)
						.json(new CustomError('Could not find user by email', err))
				);
		})
		.catch((err) =>
			res
				.status(500)
				.json(new CustomError('Could not find user by username', err))
		);
});

authRouter.route('/signin').post((req, res) => {
	const signinForm: SigninForm = req.body;

	User.findOne({ username: signinForm.username })
		.then(async (foundUser) => {
			if (foundUser === null) {
				return res.status(404).json(new CustomError('User not found'));
			}

			if (foundUser.status === 'pending') {
				return res.status(400).json(new CustomError('Email not verified'));
			}

			const isValidPassword = await compare(
				signinForm.password,
				foundUser.password
			);

			if (!isValidPassword) {
				return res.status(400).json(new CustomError('Invalid password'));
			}

			sign(
				{ user: foundUser },
				process.env.JWTSECRET!,
				{ expiresIn: 31556926 },
				(err, token) => {
					if (err) {
						return res
							.status(500)
							.json(new CustomError('Could not sign token', err));
					}

					res.status(200).json({
						// @ts-ignore
						user: { ...foundUser._doc, password: undefined },
						token,
					});
				}
			);
		})
		.catch((err) =>
			res
				.status(500)
				.json(new CustomError('Could not find user by username', err))
		);
});

authRouter.route('/signinFromToken').post((req, res) => {
	const token = req.body.token;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return verify(token, process.env.JWTSECRET!, (err: any, decoded: any) => {
		if (err) {
			return res.status(500).json(new CustomError('Unable to verify token'));
		}

		if (decoded.exp <= Date.now() / 1000) {
			return res.status(400).json(new CustomError('Token expired'));
		}

		User.findById(decoded.user._id)
			.then((foundUser) => {
				if (foundUser === null) {
					return res.status(404);
				}

				// @ts-ignore
				res.status(200).json({ ...foundUser._doc, password: undefined });
			})
			.catch((err) => {
				res.status(500).json(new CustomError('Could not find user by id', err));
			});
	});
});

authRouter.route('/verifyUser').get((req, res) => {
	const confirmationCode = req.query.code as string | undefined;

	if (!confirmationCode) {
		res.status(400).json(new CustomError('No code provided'));
	}

	User.findOneAndUpdate(
		{ confirmationCode: confirmationCode },
		{ status: 'active' },
		{ new: true }
	)
		.then((updatedUser) => {
			if (!updatedUser) {
				return res
					.status(400)
					.json(new CustomError('Error finding user with confirmation code'));
			}

			sign(
				{ user: updatedUser },
				process.env.JWTSECRET!,
				{ expiresIn: 31556926 },
				(err, token) => {
					if (err) {
						return res
							.status(500)
							.json(new CustomError('Could not sign token', err));
					}

					res.status(200).json({
						// @ts-ignore
						user: { ...updatedUser._doc, password: undefined },
						token,
					});
				}
			);
		})
		.catch((err) =>
			res
				.status(400)
				.json(new CustomError('Error finding user with confirmation code', err))
		);
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
