import mongoose from 'mongoose';

export function connectDB(DB_URI: string): void {
	mongoose.Promise = global.Promise;
	mongoose
		.connect(DB_URI)
		.then(
			() => console.log('Database connected'),
			(err: unknown) => console.log('Error connecting to database. ', err)
		);
}