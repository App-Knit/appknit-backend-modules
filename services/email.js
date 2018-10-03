/**
 * This service module deals with the sending of emails
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */
import nodemailer from 'nodemailer';
import { ResponseUtility } from '../utility';

const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: BUSINESS_EMAIL,
		pass: BUSINESS_EMAIL_PASSWORD,
	},
});

/**
 * function to send mail
 * @param {String} to		-> send email to
 * @param {String} text		-> email content
 * @param {String} subject	-> subject of email
 */
export default ({ to, text, subject = 'Mail from tutable app' }) => new Promise((resolve, reject) => {
	transporter.sendMail({
		from: BUSINESS_EMAIL,
		to,
		text,
		subject,
	}, (err) => {
		if (err) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
		}
		return resolve(ResponseUtility.SUCCESS);
	});
});
