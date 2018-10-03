/**
 * @desc This moudle handles the twilio sending message services.
 * Exposes the utility method for twilio to send messages.
 * @author gaurav sharma
 */
import twilio from 'twilio';

let client;
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;

/**
 * send a message to a number via client
 * @param {*} messageTo the recepient
 * @param {*} messageFrom the sender (Usually default)
 * @param {*} message the message body
 *
 * It requires the following environment variables
 * @requires TWILIO_ACCOUNT_SID in enviornment
 * @requires TWILIO_AUTH_TOKEN in environment
 * @requires TWILIO_PHONE in environment
 */
const sendMessage = ({
	messageTo,
	messageFrom = TWILIO_PHONE,
	message,
}) => new Promise((resolve, reject) => {

	client.messages.create({
		to: messageTo,
		from: messageFrom,
		body: message,
	}, (err, response) => {
		if (err) {
			return reject(err);
		}
		return resolve(response.sid);
	});
});

export default ({
	messageTo,
	message,
}) => new Promise(async (resolve, reject) => {
	if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
		throw new Error('Twilio Credentials Missing');
	} else {
		client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
	}
	try {
		await sendMessage({ messageTo, message });
		return resolve({ code: 100, message: 'success' });
	} catch (err) {
		return reject({ code: 104, message: 'Error sending OTP message.', error: err });
	}
});
