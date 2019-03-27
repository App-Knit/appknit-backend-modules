/**
 * @description This module handles the firebase push notification functionality
 * with a generic structure
 */
import FCM from 'fcm-push';
import { ResponseUtility } from '../utility';

const { FCM_SERVER_KEY } = process.env;
/**
 * @author gaurav sharma
 * @since 14th December 2018
 *
 * @param {String} deviceId
 * @param {String} device representing the device type.The valid device types are android and ios
 * @param {String} title the title for the notification
 * @param {String} subtitle the subtitle for the notification
 * @param {String} reference the reference to the entity
 * @param {Number} type the number indication for the entity type. This is project
 * specific and vary from project to project.
 * @param {String} picture this holds the public URL of the image to display. Could be empty
 * @param {*} payload additional payload to send. Future proof.
 */
export default ({
	deviceId,
	device,
	title,
	subtitle,
	reference,
	type,
	picture,
	payload,
}) => new Promise((resolve, reject) => {
	if (!deviceId || !title || !device) {
		return reject(ResponseUtility.MISSING_PROPS({ message: 'deviceId, device and title is required to send the notification.' }));
	}
	if (!FCM_SERVER_KEY) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing required FCM_SERVER_KEY environment vraible.' }));
	}
	const fcm = new FCM(FCM_SERVER_KEY);
	const data = {
		title,
		subtitle,
		reference,
		type,
		picture,
		payload,
	};
	const message = {
		to: deviceId,
		collapse_key: 'data',
		data,
		notification: device.toLowerCase() === 'ios' ? {
			sound: 'default',
			body: data.subtitle,
			data,
			title: data.title,
			priority: 'High',
		} : undefined,
	};
	// send the push notification
	fcm.send(message, (err, response) => {
		if (err) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending push notification.', error: err }));
		}
		return resolve(ResponseUtility.SUCCESS({ message: 'Notification sent.', data: response }));
	});
});
