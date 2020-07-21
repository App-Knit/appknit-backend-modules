/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */

import request from 'request';
import {
	ResponseUtility,
} from '../utility';


/* eslint-disable global-require */
/**
* This is the indexer for services
* @param {Array} deviceTokens the array of device tokens.
* @param {String} body the body of notification.
* @param {String} title the title of notification.
* @param {String} payload any extra data to send through notification.
* @author Jagmohan Singh
* @since 28 April, 2020
*/
const { FCM_SERVER_KEY } = process.env;


export default ({
	deviceTokens,
	body,
	title,
	payload,
}) => new Promise((resolve, reject) => {
	try {
		if (!deviceTokens.length || !title) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'deviceTokens and title is required to send the notification.' }));
		}
		if (!FCM_SERVER_KEY) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing required FCM_SERVER_KEY environment vraible.' }));
		}

		const headers = {
			'Content-Type': 'application/json',
			Authorization: `key=${FCM_SERVER_KEY}`,
		};

		const payloadData = {
			registration_ids: deviceTokens,
			data: payload,
			notification: {
				title,
				body,
			},
			priority: 'high',
			timeToLive: 86400,
		};


		const options = {
			url: 'https://fcm.googleapis.com/fcm/send',
			method: 'POST',
			body: payloadData,
			rejectUnauthorized: false,
			json: true,
			headers,
		};

		request(options, (error, response, data) => {
			if (error) {
				return reject(error);
			}
			resolve(data);
		});
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
