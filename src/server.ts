import cors from 'cors';
import express from 'express';
import { connectDB } from './helpers/db';
import dotenv from 'dotenv';
import recipeRouter from './routes/recipe.route';
import authRouter from './routes/auth.route';
import userRouter from './routes/user.route';
import weekPlanRouter from './routes/weekPlan.route';

const app = express();
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const db = connectDB(process.env.MONGODB_URI);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    let welcomeString = 'Hello from server!';
    if (db) {
        welcomeString += ' | Database connected!';
    }
    res.send(welcomeString);
});

app.use('/recipes', recipeRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/weekPlan', weekPlanRouter);

app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
);