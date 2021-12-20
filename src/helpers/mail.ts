import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
	dotenv.config();
}

interface SimpleMailOptions {
	to: string;
	subject?: string;
	html: string;
}
const transport = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: process.env.GMAIL_USER!,
		pass: process.env.GMAIL_API_PASS!,
	},
});

transport
	.verify()
	.then(() => console.log('Nodemailer ready'))
	.catch((err) => console.log('Error setting up Nodemailer', err));

export function sendMail(options: SimpleMailOptions) {
	return transport.sendMail({
		from: `"Cooklens" <${process.env.GMAIL_USER}>`,
		to: options.to,
		subject: options.subject ?? 'Cooklens Info',
		html: options.html,
	});
}
