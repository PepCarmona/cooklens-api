import cors from 'cors';
import express from 'express';
import { connectDB } from './helpers/db';
import { KEYS } from './helpers/keys';

const app = express();
const PORT = process.env.PORT || 4000;

connectDB(KEYS.cooklensDB_URI);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.send('Hello from server!'));

app.listen(PORT, () =>
	console.log(`Server is running on http://localhost:${PORT}`)
);