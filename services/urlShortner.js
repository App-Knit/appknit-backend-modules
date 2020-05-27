/**
 * @description this service gives us short link
 *  This is the indexer for services
 * @author Jagmohan Singh
 * @since 27 May, 2020
 * @param {String} url
 */
import request from 'request';
import { ResponseUtility } from '../utility';

const { FCM_SERVER_KEY, SHORT_URL } = process.env;

export default ({
	url,
}) => new Promise((resolve, reject) => {
	try {
		if (!FCM_SERVER_KEY) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing required FCM_SERVER_KEY environment vraible.' }));
		}

		const payload = {
			url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${FCM_SERVER_KEY}`,
			method: 'POST',
			'Content-Type': 'application/json',
			json: {
				dynamicLinkInfo: {
					domainUriPrefix: SHORT_URL,
					link: url,
				},
				suffix: {
					option: 'SHORT',
				},
			},
		};
		request(payload, (error, response, body) => {
			if (error) {
				return reject(error);
			}
			resolve(body);
		});
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
