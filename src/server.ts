import cors from 'cors';
import express from 'express';
import { connectDB } from './helpers/db';
import dotenv from 'dotenv';
import recipeRouter from './routes/recipe.route';
import authRouter from './routes/auth.route';
import userRouter from './routes/user.route';
import mealPlanRouter from './routes/mealPlan.route';

const app = express();
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'production') {
	dotenv.config();
}

connectDB(process.env.MONGODB_URI);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/api', (req, res) => {
	const welcomeString =
		'Hello from EC2 server! I am an Nginx reserve proxy server auto deployed by Github Actions (made by PepCarmona)';
	res.send(welcomeString);
});

const router = express.Router();
router.use('/recipes', recipeRouter);
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/mealPlan', mealPlanRouter);

app.use('/api', router);

app.listen(PORT, () =>
	console.log(`Server is running on http://localhost:${PORT}`)
);
