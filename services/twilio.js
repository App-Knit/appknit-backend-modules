/**
 * @desc This moudle handles the twilio sending message services.
 * Exposes the utility method for twilio to send messages.
 * @author gaurav sharma
 */
import twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
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

export default {
	sendMessage,
};
