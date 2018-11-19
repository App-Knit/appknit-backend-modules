import request from 'request';
import { ResponseUtility } from '../utility';
/**
 * This service will checkt he requested token by making HTTP call to facebook
 * graph API and fetches the user detals.
 *
 * @param {String} accessToken to verify
 */
export default ({ accessToken }) => new Promise((resolve, reject) => {
	if (!accessToken) {
		return reject(ResponseUtility.ERROR({ message: 'Missing required props accessToken.' }));
	}
	request.get(`https://graph.facebook.com/me?access_token=${accessToken}`, (err, response, body) => {
		if (err) {
			return reject(ResponseUtility.ERROR({ message: 'Error validating token', error: err }));
		}
		if (response.statusCode === 200) {
			const queryResponse = JSON.parse(response.body);
			return resolve(ResponseUtility.SUCCESS({ data: { ...queryResponse } }));
		}
		return reject(ResponseUtility.INVALID_ACCESS_TOKEN);
	});
});
