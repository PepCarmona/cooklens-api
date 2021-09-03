import cors from 'cors';
import express from 'express';
import { connectDB } from './helpers/db';
import dotenv from 'dotenv';

const app = express();
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'production') {
	dotenv.config();
}

connectDB(process.env.MONGODB_URI);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.send('Hello from server!'));

app.listen(PORT, () =>
	console.log(`Server is running on http://localhost:${PORT}`)
);