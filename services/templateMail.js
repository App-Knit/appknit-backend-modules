/**
 * This service module deals with the sending of template emails
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { ResponseUtility } from '../utility';

const { HOST, BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD } = process.env;
// const user = process.env.BUSINESS_EMAIL;
// const password = process.env.BUSINESS_EMAIL_PASSWORD;

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
const sendMail = ({ to, subject = 'Mail from UrbankKiddie app', html }) => new Promise((resolve, reject) => {
	// read html file here

	transporter.sendMail({
		from: user,
		to,
		html,
		subject,
	}, (err) => {
		if (err) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
		}
		return resolve(ResponseUtility.SUCCESS());
	});
});

/**
 * send this email template for now account registering
 * @param {String} to, email of the user to send email
 * @param {String} name of the recipient (for salutation)
 * @param {Number} verificationCode to send the generated verification token
 */
const NewAccountMail = ({
	to,
	name,
	verificationCode,
	templatePath = path.resolve(__dirname, 'templates', 'new_account_template.html'),
}) => new Promise((resolve, reject) => {
	const html = fs.readFileSync(templatePath, { encoding: 'utf-8' });
	const template = handlebars.compile(html);
	const props = { user_name: name, verification_code: verificationCode };
	const compiled = template(props);

	sendMail({ to, subject: 'New account created', html: compiled })
		.then(success => resolve(success))
		.catch(err => reject(err));
});

/**
 * the send the hange password email.
 * @param {String} to, email of the user to send email
 * @param {String} name of the recipient (for salutation)
 * @param {Number} code to send for verification
 */
const ChangePasswordToken = ({
	to,
	name,
	code,
	templatePath = path.resolve(__dirname, 'templates', 'new_account_template.html'),
}) => new Promise((resolve, reject) => {
	if (to && name && code) {
		const html = fs.readFileSync(templatePath, { encoding: 'utf-8' });
		const template = handlebars.compile(html);
		const props = { user_name: name, verification_code: code };
		const compiled = template(props);

		sendMail({ to, subject: 'Password Reset Request', html: compiled })
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * @param {String} to, email of the user to send email
 * @param {String} name of the recipient (for salutation)
 * @param {Number} code the new generated code
*/
const VerificationToken = ({
	to,
	name,
	code,
	templatePath = path.resolve(__dirname, 'templates', 'new_account_template.html'),
}) => new Promise((resolve, reject) => {
	if (to && name && code) {
		const html = fs.readFileSync(templatePath, { encoding: 'utf-8' });
		const template = handlebars.compile(html);
		// replace code with the URL
		const verificationCodeUrl = `${HOST}users/mailVerification/${to}/${code}`;
		const props = { user_name: name, verification_code: verificationCodeUrl };
		const compiled = template(props);

		sendMail({ to, subject: 'Verify your Email for urbankiddie Account', html: compiled })
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

export default {
	NewAccountMail,
	ChangePasswordToken,
	VerificationToken,
};
