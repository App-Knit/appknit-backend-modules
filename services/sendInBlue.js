/**
 * This service module deals with the sending of emails
 * @author Jagmohan singh
 * @since May 27, 2020
 */
import nodemailer from 'nodemailer';
import { ResponseUtility } from '../utility';

const { SEND_IN_BLUE_EMAIL, SEND_IN_BLUE_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
	host: 'smtp-relay.sendinblue.com',
	port: 587,
	auth: {
		user: SEND_IN_BLUE_EMAIL,
		pass: SEND_IN_BLUE_PASSWORD,
	},
});

/**
 * function to send mail
 * @param {String} to		-> send email to
 * @param {String} text		-> email content
 * @param {String} subject	-> subject of email
 * @param {html} html		-> html or plain email content
 */
export default ({ to, html, subject }) => new Promise((resolve, reject) => {
	transporter.sendMail({
		from: SEND_IN_BLUE_EMAIL,
		to,
		html,
		subject,
	}, (err) => {
		if (err) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
		}
		return resolve(ResponseUtility.SUCCESS);
	});
});
