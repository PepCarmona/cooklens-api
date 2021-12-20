import express from 'express';
import { compare, hash } from 'bcryptjs';
import User, { SigninForm, SignupForm } from '../models/user.model';
import { sign, verify } from 'jsonwebtoken';
import { CustomError } from '../helpers/errors';
import { sendMail } from '../helpers/mail';

const authRouter = express.Router();
authRouter.route('/mail').post((req, res) => {
	sendMail({
		to: 'pep.carmona.coll@gmail.com',
		html: `
		<div style="
			background-image: url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80');
			background-position: center;
			background-size: cover;
			padding-bottom: 40px;
		">
			<div style="
				background: linear-gradient(0deg,transparent 0%,#00000070 100%);
				color: white;
				padding: 20px;
				padding-bottom: 200px;
				text-align: center;
			">
				<span style="
					font-size: 50px;
				">
					Cooklens
				</span>
				<br/>
				<span style="
					font-size: 20px;
				">
					Great things await us!!
				</span>
			</div>
			<div style="
				width: 50%;
				min-width: 200px;
				max-width: 500px;
				background-color: #00000045;
				border-radius: 10px;
				margin-left: auto;
				margin-right: auto;
				padding: 20px;
				font-size: 16px;
				color: #F2F3F4;
				box-shadow: 0 0 10px 1px #00000045;
				backdrop-filter: blur(5px);
			">
				<div>
					<p>
						Hello user, <br/><br/>
						We are glad to see you joining our community. <br/>
						You are just a step away from being part of this amazing network!
					</p>
					<br/>
					<a 
						href="https://cooklens.pepcarmona.com/"
						style="
							display: block;
							background-color: #12B886;
							color: white;
							text-decoration: none;
							padding: 8px 20px;
							border-radius: 10px;
							width: fit-content;
						"
					>
						Confirm email address
					</a>
				</div>
			</div>
		</div>
		`,
	})
		.then((msg) => res.status(200).json(msg))
		.catch((err) =>
			res.status(400).json({
				customerror: new CustomError('Error sending email', err),
				auth: {
					user: process.env.GMAIL_USER,
					pass: process.env.GMAIL_PASSWORD,
				},
			})
		);
});
authRouter.route('/signup').post((req, res) => {
	const signupForm: SignupForm = req.body;

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
