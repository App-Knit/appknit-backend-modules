'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var nodemailer = _interopDefault(require('nodemailer'));
var bcrypt = _interopDefault(require('bcrypt'));
var jwt = _interopDefault(require('jsonwebtoken'));
var winston = require('winston');
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var AWS = _interopDefault(require('aws-sdk'));
var Stripe = _interopDefault(require('stripe'));
var handlebars = _interopDefault(require('handlebars'));
var twilio$1 = _interopDefault(require('twilio'));
var request = _interopDefault(require('request'));
var FCM = _interopDefault(require('fcm-push'));

/**
 * @description
 * Use this module to genarete the hash for the input phrase.
 * The module handles
 * 1. Generation of the hash from phrase:
 * 		This is the use case when we want to encrypt the phrase into a irreversible 
 *		hash. Basic usage example would be converting a plain text password into a hash.
 * 2. Comparing existing hash with the plain text:
 * 		This is the user case when we want to compare the existing hash with the passphrase.
 * 		Since, hashes are not decodeable, they are only comparable. This functionality will
 * 		accepts an incoming hash and a plain text phrase and perform matching based on it.
 *
 * @author gaurav sharma
 * @since 28th September 2018
 */

var hash = {
	/**
	 * @param {String} text
	 * @param {Number} iterations. Defaults to 10
	 */
	generate: ({ text, iterations = 10 }) => new Promise((resolve, reject) => {
		bcrypt.hash(text, iterations, (err, hash) => {
			return err ? reject(err) : resolve(hash.toString());
		});
	}),
	/**
	 * @param {String} hash
	 * @param {String} text
	 */
	compare: ({ hash, text }) => new Promise((resolve, reject) => {
		bcrypt.compare(text, hash, (err, compare) => {
			return err ? reject(err) : resolve(compare);
		});
	}),
};

/**
 * this utility function handles the parsing of utility messages and returns an object returning
 * whether the requested object validates or not. If yes it returns object with true
 * if not, it returns an object with the respective missing values. This will help to
 * send missing props values rather than generic missing required props error
 * @author gaurav sharma
 * @since 28th September 2018
 *
 * @param {Array} validProps, an array representing the valid properties to find in the sourceDocument
 * @param {Object} sourceDocument, an object to check for valid properties inside.
 */
var propsValidation = ({ validProps, sourceDocument }) => new Promise((resolve, reject) => {
	if (validProps && sourceDocument) {
		const missingProps = [];
		validProps.map((property) => {
			if (sourceDocument[property] === undefined) {
				missingProps.push(property);
			}
		});
		let message = '';
		if (missingProps.length) {
			message = `Missing required ${missingProps.length > 1 ? 'properties' : 'property'}`;

			// missingProps.forEach(missingProperty => message += `${missingProperty}, `);
			missingProps.map((missingProperty, index) => {
				if (index === missingProps.length - 1 && missingProps.length > 1) {
					message = `${message.substring(0, message.length - 1)} and ${missingProperty}.`;
				} else {
					message += ` ${missingProperty},`;
				}
			});
		} else {
			message = 'Validated';
		}
		message = message.trim().substring(0, message.trim().length - 1);
		return resolve({ code: missingProps.length ? 102 : 100, message });
	}
	const error = { code: 101, message: 'Needs to pass validProps and sourceDocument to check.' };
	return reject(error);
});

/**
 * @desc This module generates a random code on request
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */
var randomCode = (digits = 6) => {
	const factor = 10 ** digits;	// exponential
	let random = Math.ceil(Math.random() * factor);
	if (random.toString().length < digits) {
		const diff = 10 ** ((digits - random.toString().length) + 1);
		random += diff;
	}
	return random;
};

/**
 * This module contains the response codes that the application sends to the client
 * @author gaurav sharma
 * @since Firday, September 28, 2018 06:10 PM
 */

const MISSING_PROPS = ({ message = 'Missing required properties.' }) => Object.assign({}, { code: 101, message });
const CONN_ERR = ({ message = 'Connection Error', error = undefined }) => Object.assign({}, { code: 102, message, error });
const GENERIC_ERR = ({ code = 500, message = 'Some error', error } = {}) => Object.assign({}, { code, message, error });
const NO_USER = ({ message = 'Requested user not found' } = {}) => Object.assign({}, { code: 103, message });
const NUMBER_NOT_REGISTERED = ({ message = 'The requested number is not registered.' } = {}) => ({ code: 107, message });
const SUCCESS = ({ code = 100, message = 'Success', data = undefined } = {}) => Object.assign({}, { code, message, data });
const SUCCESS_PAGINATION = ({
	code = 100,
	message = 'success',
	data = undefined,
	page = 1,
	limit = 20,
}) => Object.assign({}, {
	code,
	message,
	data,
	page,
	limit,
	size: data.length,
	hasMore: data.length === limit || false,
});
const LOGIN_AUTH_FAILED = ({ message = 'Username/Password error' } = {}) => Object.assign({}, { code: 104, message });
const MALFORMED_REQUEST = { code: 400, message: 'Malformed Request. You might need to relogin.' };
const REFRESH_TOKEN_MISMATCH = { code: 400, message: 'Refresh token mismatch.' };
const OTP_TYPE_ERROR = { code: 108, message: 'Invalid OTP type.' };
const NOTHING_MODIFIED = ({ message = 'Nothing modified' } = {}) => ({ code: 105, message });
const INVALID_ACCESS_TOKEN = { code: 106, message: 'Invalid access token.' };
const EMAIL_ALREADY_TAKEN = ({ message = 'This Email ID is already registered.' }) => ({ code: 107, message });
const EMAIL_ALREADY_VERIFIED = { code: 110, message: 'Your email is already verified.' };
const TOKEN_NOT_VERIFIED = { code: 109, message: 'The token not verified.' };
const TOKEN_TRY_EXPIRED = { code: 111, message: 'Verficiation code try has been expired. Request a new token.' };
const TOKEN_EXPIRED = { code: 112, message: 'Your verification code has been expired. Token expires in 24 hours.' };
const INVALID_VERIFICATION_CODE = { code: 113, message: 'Invlid URL provided for verification.' };
const BROKEN_REFERENCE = { code: 114, message: 'Broken reference found' };
const MISSING_REGION = { code: 115, message: 'Profile seems to have missing region data or you are trying to post in wrong region.' };
const NOT_MEMBER_OF_GROUP = { code: 116, message: 'You are not part of this group.' };

var ResponseUtility = {
	MISSING_PROPS,
	CONN_ERR,
	NO_USER,
	SUCCESS,
	GENERIC_ERR,
	LOGIN_AUTH_FAILED,
	MALFORMED_REQUEST,
	REFRESH_TOKEN_MISMATCH,
	NOTHING_MODIFIED,
	NUMBER_NOT_REGISTERED,
	OTP_TYPE_ERROR,
	INVALID_ACCESS_TOKEN,
	EMAIL_ALREADY_TAKEN,
	SUCCESS_PAGINATION,
	TOKEN_NOT_VERIFIED,
	EMAIL_ALREADY_VERIFIED,
	TOKEN_TRY_EXPIRED,
	TOKEN_EXPIRED,
	INVALID_VERIFICATION_CODE,
	BROKEN_REFERENCE,
	MISSING_REGION,
	NOT_MEMBER_OF_GROUP,
};

/**
 * Utility function that parses the acceptable input props and generate
 * the corresponding json object containing only the defined JSON properties.
 * Generally used by the update query to append only the defined json props.
 * @author gaurav sharma
 * @since Monday, September 28, 2018
 */
var schemaMapper = jsonObject => new Promise((resolve, reject) => {
	const resultantObject = {};
	Object.keys(jsonObject).map((key, index) => {
		if (jsonObject[key] !== undefined && key !== 'id') {
			resultantObject[key] = jsonObject[key];
		}
		if (index === Object.keys(jsonObject).length - 1) {
			if (Object.keys(resultantObject).length >= 1) {
				resolve(resultantObject);
			}
			reject(ResponseUtility.GENERIC_ERR({ message: 'No defined field', error: 'There is no defined field in json Object. The resultant object is empty.' }));
		}
	});
});

/**
 * @desc This module performs the time to millis conversion
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

/**
 * Converts the minutes into millis
 * @param {number} minutes -> number of minutes to convert to minutes
 */
const minutesToMillis = minutes => minutes * 60000;

/**
 * Convert hours to millis
 * @param {number} hours -> number of hours to convert into millis
 */
const hoursToMillis = hours => minutesToMillis(hours * 60);

/**
 * convert days to millis
 * @param {number} days -> number of days to convert to millis
 */
const daysToMillis = days => hoursToMillis(days * 24);

/**
 * returns the timestamp in Day Month Year, Hours:Minutes format.
 * @param {Number} timestamp
 */
const formatTimestamp = (timestamp) => {
	const date = new Date(timestamp).toString();
	const splits = date.split(' ');
	const timeSplits = splits[4].split(':');
	const day = splits[2];
	const month = splits[1];
	const year = splits[3];
	const hours = timeSplits[0];
	const minutes = timeSplits[1];

	return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const monthName = month => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];

var time = {
	minutesToMillis,
	hoursToMillis,
	daysToMillis,
	formatTimestamp,
	monthName,
};

/**
 * this module deals with the encoding and decoding of the generated tokens
 * using jsonwebtoken
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

const secretString = process.env.SECRET_STRING;
/**
  * this will generate the jwt toke for the payload
  * by default, token will expire after an hour.
  * @param {*} payload the data to generate token from
  */
const generateToken = payload => jwt.sign(
	{ data: payload },
	secretString,
	{ expiresIn: payload.tokenLife },
);
/**
  * this will decode the input token to the corresponding payload
  * @param {*} token to decode. To be referred from generateToken method
  */
const decodeToken = token => jwt.verify(token, secretString, (err, decoded) => {
	if (err) {
		return undefined;
	} if (decoded.exp) {
		if (decoded.expiresIn) {
			if (new Date(decoded.expiresIn).getTime() <= new Date().getTime()) {
				return undefined;
			}
		}
		return decoded;
	}
	return undefined;
});

var token = {
	generateToken,
	decodeToken,
};

/**
 * This service module deals with the sending of emails
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD } = process.env;

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
var EmailServices = ({ to, text, subject = 'Mail from app' }) => new Promise((resolve, reject) => {
	transporter.sendMail({
		from: BUSINESS_EMAIL,
		to,
		text,
		subject,
	}, (err) => {
		if (err) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
		}
		return resolve(ResponseUtility.SUCCESS);
	});
});

/**
 * This module deals with the middleware for on the fly multipart handler
 * before uploading it to s3. High Resolution Images are avoided.
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 * @todo handle multiple images upoad
 *
 * This multipart service will merge the passed images in the body with the same
 * name. There is a proposal to define a new service that handles the Mergin Multipart
 * data feature. MergingMulripart service will merge all the incoming binaries into a single
 * array to name binaries.
 */
var multipart = (req, res, next) => {
	const { files, body: { data, id } } = req;
	req.body = data ? JSON.parse(data) : {};
	if (id) {
		req.body.id = id;
	}
	if (files && Object.keys(files).length) {
		Object.keys(files).map((fileKey) => {
			req.body[fileKey] = files[fileKey].data;
		});
	}
	next();
};

/**
 * @desc This module contains the logger service for the application urbankiddie.
 * The logging service is a middleware.
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

const {
	// SLACK_TOKEN,
	// SLACK_WEBOOK_URL,
	// SLACK_LOG_CHANNEL,
	DEVELOPER_EMAIL,
} = process.env;

// winston.add(Slack, options);

const requestsLogger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: './logs/request-info.log', level: 'info' }),
	],
});
const responseLogger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: './logs/response-info.log', level: 'info' }),
	],
});

/**
  * Interceptor for the incoming request
  * @param {*} req
  * @param {*} res
  * @param {*} next
  */
const RequestInterceptor = (req, res, next) => {
	const { body, headers, path } = req;
	const data = new Object(body);
	data.format = 'request';
	data.path = path;
	data.headers = headers;
	data.timestamp = new Date();

	requestsLogger.log({ level: 'info', message: data });
	next();
};

// const SlackRequestInterceptor = (req, res, next) => {
// 	const { body, headers, path } = req;
// 	const data = new Object(body);
// 	data.format = 'request';
// 	data.headers = headers;
// 	data.timestamp = new Date();

// 	createLogger({
// 		level: 'info',
// 		format: format.json(),
// 		transports: new Slack({
// 			domain: '',
// 			token: SLACK_TOKEN,
// 			webhook_url: SLACK_WEBOOK_URL,
// 			channel: SLACK_LOG_CHANNEL,
// 			level: 'info',
// 		}),
// 	}).log({ level: 'info', message: data });
// 	next();
// };
/**
  * Intercetor for the response
  * @param {*} req
  * @param {*} res
  * @param {*} next
  */
const ResponseInterceptor = (req, res, next) => {
	const { send } = res;
	res.send = function (body) {
		const data = new Object(body);
		data.format = 'response';
		data.timestamp = new Date();
		responseLogger.log({ level: 'info', message: data });
		send.call(this, body);
	};
	next();
};

// const SlackResponseInterceptor = (req, res, next) => {
// 	const { send } = res;
// 	res.send = function (body) {
// 		const data = new Object(body);
// 		data.format = 'response';
// 		data.timestamp = new Date();
// 		createLogger({
// 			level: 'info',
// 			format: format.json(),
// 			transports: new Slack({
// 				domain: '',
// 				token: SLACK_TOKEN,
// 				webhook_url: SLACK_WEBOOK_URL,
// 				channel: SLACK_LOG_CHANNEL,
// 				level: 'info',
// 			}),
// 		}).log({ level: 'info', message: data });
// 		send.call(this, body);
// 	};
// 	next();
// };

/**
 * activate the exeption logs
 * @todo test this functionality
 */
const ActivateExceptionLogs = () => {
	process.on('uncaughtException', async (err) => {
		await EmailServices({ to: DEVELOPER_EMAIL, text: err.stack, subject: 'Uncaught Exception in urbankiddie.' });
	});

	process.on('unhandledRejection', async (err) => {
		await EmailServices({ to: DEVELOPER_EMAIL, text: err.stack, subject: 'Unhandled promise rejection in urbankiddie.' });
	});
};

var logger = {
	ResponseInterceptor,
	RequestInterceptor,
	// SlackRequestInterceptor,
	// SlackResponseInterceptor,
	ActivateExceptionLogs,
};

/**
 * @desc This module handles the AWS s3 actions. i.e uploading stuff to s3 bucker
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 *
 * @todo
 * 1. Handle proper error messages for missing required props using
 * PropsValidationUtility.
 */

const { AWS_ACCESSID, AWS_SECRET, S3_BUCKET } = process.env;

const s3 = new AWS.S3({
	accessKeyId: AWS_ACCESSID,
	secretAccessKey: AWS_SECRET,
	Bucket: S3_BUCKET,
});
var s3$1 = {
	/**
	  * Upload a file to s3 bucket
	  * @param {string} bucket	-> refers to the name of the bucket
	  * @param {object} file	-> refers to the file object to upload
	  */
	uploadToBucket: ({ Bucket, data, Key }) => new Promise((resolve, reject) => {
		if (Bucket && data && Key) {
			const params = {
				Bucket,
				Key,
				Body: data,
			};
			s3.upload(params, (err, uploadResponse) => {
				if (err) {
					reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading file', error: err }));
				} else {
					resolve(ResponseUtility.SUCCESS({ data: uploadResponse }));
				}
			});
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	}),

	uploadPublicObject: ({
		Bucket, data, Key, mime,
	}) => new Promise((resolve, reject) => {
		if (Bucket && data && Key) {
			const params = {
				ACL: 'public-read',
				Bucket,
				Key,
				Body: data,
				ContentType: mime,
			};

			s3.putObject(params, (err, response) => {
				if (err) {
					reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading file', error: err }));
				} else {
					resolve(ResponseUtility.SUCCESS({ data: response }));
				}
			});
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	}),

	uploadLocalFile: ({ Key, Bucket }) => new Promise((resolve, reject) => {
		fs.readFile(path.resolve(LOCAL_IMAGE_PATH, Key), (err, Body) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Cannot read local file', error: err }));
			} else {
				s3.putObject({ Bucket, Key, Body }, (putError, data) => {
					if (putError) {
						reject(ResponseUtility.GENERIC_ERR({ message: 'Error saving image to s3', error: putError }));
					} else {
						resolve(ResponseUtility.SUCCESS({ data }));
					}
				});
			}
		});
	}),
	/**
	  * Save the buffer image on s3
	  */
	putBuffer: ({ Bucket, Body, Key }) => new Promise((resolve, reject) => {
		s3.putObject({ Body, Bucket, Key }, (err, data) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading image to s3', error: err }));
			} else {
				resolve(ResponseUtility.SUCCESS({ data }));
			}
		});
	}),
	/**
	  * @desc Find a file in s3 bucket
	  * @param {String} bucket	-> name of bucket
	  * @param {String} key		-> name of file
	  */
	findFile: ({ Bucket, Key }) => new Promise((resolve, reject) => {
		const params = {
			Bucket,
			Key,
		};
		s3.getObject(params, (err, object) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ messafe: 'Error looking for file', error: err }));
			} else {
				resolve(ResponseUtility.SUCCESS({ data: object }));
			}
		});
	}),

	/**
	  * Remove the requested file
	  * @param {String} Bucket	-> the name of bucket to look for file
	  * @param {String} Key		-> the file name to delete
	  */
	removeFile: ({ Bucket, Key }) => new Promise((resolve, reject) => {
		if (Bucket && Key) {
			const params = { Bucket, Key };
			s3.deleteObject(params, (err) => {
				if (err) {
					reject(ResponseUtility.GENERIC_ERR({ message: 'Error deleting object', error: err }));
				} else {
					resolve(ResponseUtility.SUCCESS);
				}
			});
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	}),

	/**
	 * @desc this function creates a new folder inside a bucket
	 * @param {String} Bucket	-> the bucket to create a folder in
	 * @param {String} Key		-> the name of the folder to create
	 */
	createFolderInsideBucket: ({ Bucket, Key }) => new Promise((resolve, reject) => {
		const params = { Bucket, Key };

		s3.putObject(params, (err) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Error creating bucket', error: err }));
			} else {
				resolve(ResponseUtility.SUCCESS);
			}
		});
	}),

	/**
	 * API to list down the bucket content
	 * @param {String} bucket	-> the name of the bucket
	 * @param {String} Folder	-> name of the folder to fetch data from
	 */
	listBucketContent: ({ Bucket, Folder }) => new Promise((resolve, reject) => {
		const params = { Bucket, Prefix: `${Folder}/` };
		s3.listObjects(params, (err, objects) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Error finding the bucket content', error: err }));
			} else {
				objects.Contents.splice(0, 1);
				const files = [];
				objects.Contents.map((object) => {
					const { Key } = object;
					const generateURL = `/owner/getClubPicture/${Key}`;
					files.push(generateURL);
				});
				resolve(ResponseUtility.SUCCESS({ data: files }));
			}
		});
	}),

	S3: s3,
};

/**
 * @desc The module containing the stripe related functionality
 * to handle the stripe payments
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

const { STRIPE_SECRET_KEY } = process.env;
const stripe = new Stripe(STRIPE_SECRET_KEY);
const fees = {
	USD: { Percent: 2.9, Fixed: 0.30 },
	GBP: { Percent: 2.4, Fixed: 0.20 },
	EUR: { Percent: 2.4, Fixed: 0.24 },
	CAD: { Percent: 2.9, Fixed: 0.30 },
	AUD: { Percent: 2.9, Fixed: 0.30 },
	NOK: { Percent: 2.9, Fixed: 2 },
	DKK: { Percent: 2.9, Fixed: 1.8 },
	SEK: { Percent: 2.9, Fixed: 1.8 },
	JPY: { Percent: 3.6, Fixed: 0 },
	MXN: { Percent: 3.6, Fixed: 3 },
};
/**
 * create a unique stripe user. Will check from database
 * regarding the existence and will be called if key has not
 * been generated already for an existing user.
 * This will create the new user with credit card details.
 * Usually, this will be created for the student account
 * @param {String} email
 * @param {String} id
 * @param {String} card, to be provided for student profile
 * @param {String} bank, to be provided for teacher profile
 * either user email or id is required
 * either card or bank token of the user is required.
 */
const CreateUser = ({
	email,
	id,
	card,
}) => new Promise(async (resolve, reject) => {
	if ((email || id) && card) {
		stripe.customers.create({
			email: email || id,
			description: `Stripe details for ${email || id} customer`,
			source: card,
		}).then((success) => {
			const object = { altered: success, raw: success };
			resolve(object);
		}).catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * remove the requested card from the list
 *@see https://stripe.com/docs/api#delete_card
 * @param {*} param0
 */
const RemoveCard = ({ customerId, cardId }) => new Promise((resolve, reject) => {
	// console.log(customerId, cardId);
	if (customerId && cardId) {
		stripe.customers.deleteCard(customerId, cardId)
			.then((success) => {
				resolve(success);
			}).catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});
/**
 * delete an external stripe account
 * This is invoked when a suer requests ot remove a linked banked
 * account with the external account.
 * @param {*} param0
 */
const RemoveExternalAccount = ({ accountId, bankId }) => new Promise((resolve, reject) => {
	if (accountId) {
		stripe.accounts.deleteExternalAccount(accountId, bankId)
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * accept the new bank account details and replace it with the new ones
 * @param {*} param0
 */
const UpdateExternalAccount = ({ accountId, externalAccount }) => new Promise((resolve, reject) => {
	if (accountId && externalAccount) {
		stripe.accounts.update(accountId, {
			external_account: externalAccount,
		})
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * Create a new bank user
 */
const CreateBankUser = ({
	email,
	token,	// the bank account id
	personalDetails: {
		address: {
			city,
			country,
			line1,
			postal,
			state,
		},
		dob: {
			day,
			month,
			year,
		},
		firstName,
		lastName,
		type,
		ip,
	},
	verificationDocumentData,
}) => new Promise(async (resolve, reject) => {
	if (email && token && city && line1 && postal && state
		&& day && month && year && firstName && lastName && type && ip) {
		/**
		 * create a user with bank account
		 * process with sripe connect API
		 * 1. create a new account with stripe connect API
		 * 2. Add a bank account via token,
		 */
		const account = await stripe.account.create({ type: 'custom', country: 'AU', email });
		if (account) {
			const { id } = account;
			const updatedAccount = await stripe.accounts.update(id, {
				external_account: token,
				tos_acceptance: {
					date: Math.floor(Date.now() / 1000),
					ip,
				},
				legal_entity: {
					address: {
						city,
						country,
						line1,
						postal_code: postal,
						state,
					},
					first_name: firstName,
					last_name: lastName,
					type,
					dob: {
						day,
						month,
						year,
					},
				},
			});
			// console.log(updatedAccount);
			if (updatedAccount) {
				// upload the verrificaiton document here.
				const upload = await stripe.fileUploads.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentData,
							name: '',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: id },
				);

				/**
				 * @todo parse the returned token and attach it with the
				 * stripe account
				 */
				const attach = await stripe.accounts.update(id, {
					legal_entity: {
						verification: {
							document: upload.id,
						},
					},
				});
				console.log(attach);
				// added an partner account with bank account.
				const response = { altered: { id: updatedAccount.id, default_source: updatedAccount.external_accounts.data[0].id }, raw: updatedAccount };
				resolve(response);
			} else {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Erro adding external account to the created partner account ' }));
			}
		}
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * create a new payment for the provided source. Handle respective errror
 * @param {Number} amount
 * @param {String} currency
 * @param {String} source the id of the card
 * @param {String} description
 */
const CreatePayment = ({
	amount,
	currency = 'AUD',
	source,
	customer,
	description,
}) => new Promise((resolve, reject) => {
	if (amount && currency && source) {
		stripe.charges.create({
			amount,
			currency,
			source,
			customer,
			description,
		})
			.then(success => resolve(success))
			.catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * handle the payout to the teachers account
 * @param amount
 * @param description
 * @param destination The ID of a bank account or a card to send the payout to.
 * If no destination is supplied, the default external account for the specified
 * currency will be used.
 * @param sourceType The source balance to draw this payout from. Balances for
 * different payment sources are kept separately. You can find the amounts with
 * the balances API. Valid options are: alipay_account, bank_account, and card.
 * @see https://stripe.com/docs/api/node#create_payout for more
 * @return Promise
 */
const HandlePayout = ({
	amount,
	description,
	destination,
	sourceType,
}) => new Promise((resolve, reject) => {
	/**
	 * @todo handle payouts implementation
	 */
	if (amount && description && destination) {
		stripe.transfers.create({
			amount,
			destination,
			currency: 'aud',
			transfer_group: 'TEST_TRANSFERS',
		})
			.then(success => resolve(ResponseUtility.SUCCESS({ data: success })))
			.catch(err => reject(ResponseUtility.GENERIC_ERR({ message: '', error: err })));
	}
});

/**
 * cerate a customer account to handle payouts
 * @see https://stripe.com/docs/api/node#create_account
 * @param {String} email
 */
const CreateCustomAccount = ({ email }) => new Promise((resolve, reject) => {
	stripe.accounts.create({
		type: 'custom',
		country: 'AU',
		email,
	}).then((account) => {
		resolve(account);
	}).catch(err => reject(err));
});

/**
 * add externa account to a stripe connect account.
 * use the stripe account update function to add external account
 */
const AddExternalAccount = ({ account, businessName, token }) => new Promise((resolve, reject) => {
	if (account && (businessName || token)) {
		stripe.accounts.update(account, {
			business_name: businessName,
			external_account: token,
		}).then((success) => {
			resolve(success);
		}).catch(err => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
 * @desc process the refeund based on the incurred charge
 * @param {String} chargeId the id of the charge to process refund.
 * @param {Number} amount if defined, the amount of money will be refunded, By deducting some charges
 */
const ProcessRefund = ({ chargeId, amount }) => new Promise(async (resolve, reject) => {
	if (!chargeId && !amount) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	// console.log('here');
	if (amount) {
		try {
			const chargeResponse = await stripe.refunds.create({
				charge: chargeId,
				amount,
			});
			return resolve(chargeResponse);
		} catch (err) {
			return reject(err);
		}
	}

	try {
		const response = await stripe.refunds.create({
			charge: chargeId,
		});
		resolve(response);
	} catch (err) {
		// console.log(err);
		reject(err);
	}
});

/**
 * @desc create a connect account for user for payouts.
 * @param {String} email of the user.
 * @param {String} token the stripe token of the bank account.
 * @param {String} StripeId the stripe connect id of the user.
 * @param {Buffer} verificationDocumentDataBack the image buffer of
 * backside of the user's verification id proof.
 * @param {Buffer} verificationDocumentDataFront the image buffer of
 * frontside of the user's verification id proof.
 * @param {String} city the city of the user.
 * @param {String} country the country of the user.
 * @param {String} line1 the address line one of the user.
 * @param {String} line2 the address line two of the user.
 * @param {String} postal_code the postal code of the user.
 * @param {String} type the Stripe account type. Can be "standard",
 * "express", or "custom".
 * @param {String} business_type the business type of stripe account.
 * Can be "individual" or "company".
 * @param {String} state the state of the user.
 * @param {String} first_name the first name of the user.
 * @param {String} last_name the last name of the user.
 * @param {Number} day the date of the user birh.
 * @param {Number} month the month of the user birh.
 * @param {Number} year the year of the user birh.
 * @param {Number} gender the gender of the user either "male" or "female".
 * @param {Number} phone the phone number of the user.
 * @param {Number} ssn_last_4 the last 4 digits of user's social security number.
 * @param {Number} ip the ip address of user's device.
 * @param {String} url the url of user's business website.
 * @param {Number} mcc the Merchant Category Code of the user.
 */

const CreateBankUserV2 = ({
	email,
	token,
	StripeId,
	verificationDocumentDataBack,
	verificationDocumentDataFront,
	city,
	country,
	line1,
	line2,
	postal_code,
	type,
	business_type,
	state,
	first_name,
	last_name,
	day,
	month,
	year,
	gender,
	phone,
	ssn_last_4,
	ip,
	url,
	mcc,
}) => new Promise(async (resolve, reject) => {
	try {
		if ((email || StripeId) && token) {
			let accountData;
			if (email) {
				const account = await stripe.account.create({
					type,
					country,
					email,
					business_type,
					requested_capabilities: ['card_payments'],
				});
				const uploadFront = await stripe.files.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentDataFront,
							name: 'identity_document_front',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: account.id },
				);
				const uploadBack = await stripe.files.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentDataBack,
							name: 'identity_document_back',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: account.id },
				);
				accountData = await stripe.accounts.update(account.id,
					{
						external_account: token,
						tos_acceptance: {
							date: Math.floor(Date.now() / 1000),
							ip,
						},
						business_profile: {
							url,
							mcc,
						},
						individual: {
							address: {
								city,
								country,
								line1,
								line2,
								postal_code,
								state,
							},
							first_name,
							last_name,
							dob: {
								day,
								month,
								year,
							},
							gender,
							phone,
							email,
							ssn_last_4,
							verification: {
								document: {
									back: uploadFront.id,
									front: uploadBack.id,
								},
							},
						},
					});
			} else {
				accountData = await stripe.accounts.update(StripeId,
					{
						external_account: token,
						individual: {
							address: {
								city,
								country,
								line1,
								line2,
								postal_code,
								state,
							},
							dob: {
								day,
								month,
								year,
							},
							gender,
							phone,
							email,
						},
					});
			}
			resolve(accountData);
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	} catch (err) {
		reject(err);
	}
});

/**
 * @desc add a new source and attach it to user for payments.
 * @param {String} customer the stripe id of the customer.
 * @param {String} source the stripe token of the source.
 */

const CreateSource = ({ customer, source }) => new Promise(async (resolve, reject) => {
	if (!customer && !source) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	try {
		const response = await stripe.customers.createSource(customer, { source });
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

/**
 * @desc delete a source from customer's account.
 * @param {String} customer the stripe id of the customer.
 * @param {String} source the stripe token of the source.
 */

const DeleteSource = ({ customer, source }) => new Promise(async (resolve, reject) => {
	if (!customer && !source) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	try {
		const response = await stripe.customers.deleteSource(customer, source);
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

/**
 * @desc update defaut source of payment for user.
 * @param {String} customer the stripe id of the customer.
 * @param {String} source the stripe token of the source.
 */

const UpdateDefaultSource = ({ customer, defaultSource }) => new Promise(async (resolve, reject) => {
	if (!customer && !defaultSource) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	try {
		const response = await stripe.customers.update(customer, { default_source: defaultSource });
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

/**
 * @desc calculate stripe service charges for a payment.
 * @param {Number} amount the amount of the payment.
 * @param {String} source the currency used for payment.
 */

const calculateStripeServiceCharges = ({ amount, currency }) => {
	const charges = fees[currency];
	const calculatedAmount = parseFloat(amount);
	const fee = ((calculatedAmount * charges.Percent) / 100) + charges.Fixed;
	const net = parseFloat(calculatedAmount) + parseFloat(fee);
	return {
		amount,
		fee: parseFloat(parseFloat(fee).toFixed(2)),
		net: parseFloat(parseFloat(net).toFixed(2)),
	};
};

var stripe$1 = {
	stripe,
	CreateUser,
	CreatePayment,
	HandlePayout,
	CreateCustomAccount,
	AddExternalAccount,
	CreateBankUser,
	ProcessRefund,
	RemoveCard,
	RemoveExternalAccount,
	UpdateExternalAccount,
	CreateSource,
	DeleteSource,
	CreateBankUserV2,
	UpdateDefaultSource,
	calculateStripeServiceCharges,
};

/**
 * This service module deals with the sending of template emails
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

const { HOST, BUSINESS_EMAIL: BUSINESS_EMAIL$1, BUSINESS_EMAIL_PASSWORD: BUSINESS_EMAIL_PASSWORD$1 } = process.env;

const transporter$1 = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: BUSINESS_EMAIL$1,
		pass: BUSINESS_EMAIL_PASSWORD$1,
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

	transporter$1.sendMail({
		from: BUSINESS_EMAIL$1,
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
 * @param {String} templatePath path to the template file
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
 * @param {String} templatePath path to the template file
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
 * @param {String} templatePath path to the template file
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

var templateMail = {
	NewAccountMail,
	ChangePasswordToken,
	VerificationToken,
};

/**
 * @desc This moudle handles the twilio sending message services.
 * Exposes the utility method for twilio to send messages.
 * @author gaurav sharma
 */

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

var twilio = ({
	messageTo,
	message,
}) => new Promise(async (resolve, reject) => {
	if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
		throw new Error('Twilio Credentials Missing');
	} else {
		client = twilio$1(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
	}
	try {
		await sendMessage({ messageTo, message });
		return resolve({ code: 100, message: 'success' });
	} catch (err) {
		return reject({ code: 104, message: 'Error sending OTP message.', error: err });
	}
});

/**
 * This service will checkt he requested token by making HTTP call to facebook
 * graph API and fetches the user detals.
 *
 * @param {String} accessToken to verify
 */
var verifyFacebookToken = ({ accessToken }) => new Promise((resolve, reject) => {
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

/**
 * @desc handle multipart as array of buffers
 * for multiple files
 * @author gaurav sharma
 * @since 17nd November 2018
 * Adapted while Faraya Application
 */
var mergingMultipart = (req, res, next) => {
	const { files, body: { data, id } } = req;
	req.body = data ? JSON.parse(data) : {};
	if (id) {
		req.body.id = id;
	}
	if (files && Object.keys(files).length) {
		Object.keys(files).map((fileKey) => {
			if (!req.body.images) {
				req.body.images = [files[fileKey].data];
			} else {
				req.body.images.push(files[fileKey].data);
			}
		});
	}
	return next();
};

/**
 * @description
 * This is the conceptual middleware that handles the custom JSON property to
 * incoming body and hence pass to the modelPromise funciton. The property injection
 * allows to use the same API in multiple ways.
 * @author gaurav sharma
 * @since 2nd November 2018
 * @example
 * export default app => {
 * 		app.post(`${prefix}create`, MergingMultipartService, AuthenticationControllers.authenticateUser, VenueControllers.create);
 * 		app.post(`${prefix}details`, AuthenticationControllers.authenticateUser, VenueControllers.details);
 * 		app.post(`${prefix}update`, MergingMultipartService,PropsInjectionService({ update: true }), AuthenticationControllers.authenticateUser, VenueControllers.create);
 *	}
}
 */
var propsInjection = (property) => {
	const safeKeys = ['id'];
	return (req, res, next) => {
		const { body: { data, id }, body } = req;
		req.body = data ? JSON.parse(data) : body ? body : {};
		if (id) {
			req.body.id = id;
		}
		Object.keys(property).map((key) => {
			if (!safeKeys.includes(key)) {
				req.body[key] = property[key];
			}
		});
		next();
	};
};

/**
 * @description This module handles the firebase push notification functionality
 * with a generic structure
 */

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
var firebasePushNotifications = ({
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

exports.EmailServices = EmailServices;
exports.FirebasePushNotificationService = firebasePushNotifications;
exports.HashUtility = hash;
exports.LogServices = logger;
exports.MergingMultipartService = mergingMultipart;
exports.MessagingService = twilio;
exports.MultipartService = multipart;
exports.PropsInjectionService = propsInjection;
exports.PropsValidationUtility = propsValidation;
exports.RandomCodeUtility = randomCode;
exports.ResponseUtility = ResponseUtility;
exports.S3Services = s3$1;
exports.SchemaMapperUtility = schemaMapper;
exports.StripeServices = stripe$1;
exports.TemplateMailServices = templateMail;
exports.TimeConversionUtility = time;
exports.TokenUtility = token;
exports.VerifyFacebookTokenService = verifyFacebookToken;
