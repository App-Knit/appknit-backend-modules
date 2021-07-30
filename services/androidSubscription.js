import { google } from 'googleapis';

const publisher = google.androidpublisher('v3');

export default (receipt, creds) => new Promise((resolve, reject) => {
	const SERVICE_ACCOUNT_EMAIL = process.env;

	const jwtClient = new google.auth.JWT(
		SERVICE_ACCOUNT_EMAIL,
		null,
		creds.private_key,
		['https://www.googleapis.com/auth/androidpublisher'],
		null,
	);

	google.options({ auth: jwtClient });

	publisher.purchases.subscriptions.get(receipt).then(response => resolve(response))
		.catch(err => reject(err));
});
