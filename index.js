/**
 * This will export all the required packages.
 * Acts as an indexer
 *
 * @author gaurav sharma
 * @since 28th september 2018
 * @license AppKnit
 */
const {
	TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN,
	TWILIO_PHONE,
	STRIPE_SECRET_KEY,
	AWS_ACCESSID,
	AWS_SECRET,
	S3_BUCKET,
	BUSINESS_EMAIL,
	BUSINESS_EMAIL_PASSWORD,
} = process.env;

export * from './services';
export * from './utility';
// export default ({
// 	loadTwilio = true,
// 	loadS3 = true,
// 	loadStripe = true,
// 	loadEmail = true,
// } = {}) => {
// 	module.exports.Utility = Utility;
// 	module.exports.LogServices = Services.LogServices.default;
// 	module.exports.MultipartService = Services.MultipartService.default;
// 	if (loadTwilio) {
// 		// check for twilio environment variables
// 		if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
// 			throw new Error('Twilio Credentials Missing');
// 		} else {
// 			module.exports.MessagingServices = Services.MessagingService.default;
// 		}
// 		// export { MessagingService as MessagingService } from './services';
// 	}
// 	if (loadStripe) {
// 		if (!STRIPE_SECRET_KEY) {
// 			throw new Error('Stripe Secret Key Missing');
// 		} else { 
// 			module.exports.StripeServices = Services.StripeServices.default;
// 		}
// 		// export { StripeServices as StripeServices } from './services';
// 	}
// 	if (loadS3) {
// 		if (!AWS_ACCESSID || !AWS_SECRET || !S3_BUCKET) {
// 			throw new Error('AWS S3 Credentials Missing.');
// 		} else {
// 			module.exports.S3Services = Services.S3Services.default;
// 		}
// 		// export { S3Services as S3Services } from './services';
// 	}
// 	if (loadEmail) {
// 		if (!BUSINESS_EMAIL || !BUSINESS_EMAIL_PASSWORD) {
// 			throw new Error('Missing Email Credentials.');
// 		} else {
// 			module.exports.EmailServices = Services.EmailServices.default;
// 			module.exports.TemplateMailServices = Services.TemplateMailServices.default;
// 		}
// 	}
// };
