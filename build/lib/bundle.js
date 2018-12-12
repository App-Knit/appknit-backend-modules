'use strict';

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopDefault(ex) {
  return ex && _typeof(ex) === 'object' && 'default' in ex ? ex['default'] : ex;
}

var bcrypt = _interopDefault(require('bcrypt'));

var jwt = _interopDefault(require('jsonwebtoken'));

var nodemailer = _interopDefault(require('nodemailer'));

var winston = require('winston');

var fs = _interopDefault(require('fs'));

var path = _interopDefault(require('path'));

var AWS = _interopDefault(require('aws-sdk'));

var Stripe = _interopDefault(require('stripe'));

var handlebars = _interopDefault(require('handlebars'));

var twilio = _interopDefault(require('twilio'));

var request = _interopDefault(require('request'));
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
  generate: function generate(_ref) {
    var text = _ref.text,
        _ref$iterations = _ref.iterations,
        iterations = _ref$iterations === void 0 ? 10 : _ref$iterations;
    return new Promise(function (resolve, reject) {
      bcrypt.hash(text, iterations, function (err, hash) {
        return err ? reject(err) : resolve(hash.toString());
      });
    });
  },

  /**
   * @param {String} hash
   * @param {String} text
   */
  compare: function compare(_ref2) {
    var hash = _ref2.hash,
        text = _ref2.text;
    return new Promise(function (resolve, reject) {
      bcrypt.compare(text, hash, function (err, compare) {
        return err ? reject(err) : resolve(compare);
      });
    });
  }
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

var propsValidation = function propsValidation(_ref3) {
  var validProps = _ref3.validProps,
      sourceDocument = _ref3.sourceDocument;
  return new Promise(function (resolve, reject) {
    if (validProps && sourceDocument) {
      var missingProps = [];
      validProps.map(function (property) {
        if (sourceDocument[property] === undefined) {
          missingProps.push(property);
        }
      });
      var message = '';

      if (missingProps.length) {
        message = "Missing required ".concat(missingProps.length > 1 ? 'properties' : 'property'); // missingProps.forEach(missingProperty => message += `${missingProperty}, `);

        missingProps.map(function (missingProperty, index) {
          if (index === missingProps.length - 1 && missingProps.length > 1) {
            message = "".concat(message.substring(0, message.length - 1), " and ").concat(missingProperty, ".");
          } else {
            message += " ".concat(missingProperty, ",");
          }
        });
      } else {
        message = 'Validated';
      }

      message = message.trim().substring(0, message.trim().length - 1);
      return resolve({
        code: missingProps.length ? 102 : 100,
        message: message
      });
    }

    var error = {
      code: 101,
      message: 'Needs to pass validProps and sourceDocument to check.'
    };
    return reject(error);
  });
};
/**
 * @desc This module generates a random code on request
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */


var randomCode = function randomCode() {
  var digits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
  var factor = Math.pow(10, digits); // exponential

  var random = Math.ceil(Math.random() * factor);

  if (random.toString().length < digits) {
    var diff = Math.pow(10, digits - random.toString().length + 1);
    random += diff;
  }

  return random;
};
/**
 * This module contains the response codes that the application sends to the client
 * @author gaurav sharma
 * @since Firday, September 28, 2018 06:10 PM
 */


var MISSING_PROPS = function MISSING_PROPS(_ref4) {
  var _ref4$message = _ref4.message,
      message = _ref4$message === void 0 ? 'Missing required properties.' : _ref4$message;
  return Object.assign({}, {
    code: 101,
    message: message
  });
};

var CONN_ERR = function CONN_ERR(_ref5) {
  var _ref5$message = _ref5.message,
      message = _ref5$message === void 0 ? 'Connection Error' : _ref5$message,
      _ref5$error = _ref5.error,
      error = _ref5$error === void 0 ? undefined : _ref5$error;
  return Object.assign({}, {
    code: 102,
    message: message,
    error: error
  });
};

var GENERIC_ERR = function GENERIC_ERR() {
  var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref6$code = _ref6.code,
      code = _ref6$code === void 0 ? 500 : _ref6$code,
      _ref6$message = _ref6.message,
      message = _ref6$message === void 0 ? 'Some error' : _ref6$message,
      error = _ref6.error;

  return Object.assign({}, {
    code: code,
    message: message,
    error: error
  });
};

var NO_USER = function NO_USER() {
  var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref7$message = _ref7.message,
      message = _ref7$message === void 0 ? 'Requested user not found' : _ref7$message;

  return Object.assign({}, {
    code: 103,
    message: message
  });
};

var NUMBER_NOT_REGISTERED = function NUMBER_NOT_REGISTERED() {
  var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref8$message = _ref8.message,
      message = _ref8$message === void 0 ? 'The requested number is not registered.' : _ref8$message;

  return {
    code: 107,
    message: message
  };
};

var SUCCESS = function SUCCESS() {
  var _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref9$code = _ref9.code,
      code = _ref9$code === void 0 ? 100 : _ref9$code,
      _ref9$message = _ref9.message,
      message = _ref9$message === void 0 ? 'Success' : _ref9$message,
      _ref9$data = _ref9.data,
      data = _ref9$data === void 0 ? undefined : _ref9$data;

  return Object.assign({}, {
    code: code,
    message: message,
    data: data
  });
};

var SUCCESS_PAGINATION = function SUCCESS_PAGINATION(_ref10) {
  var _ref10$code = _ref10.code,
      code = _ref10$code === void 0 ? 100 : _ref10$code,
      _ref10$message = _ref10.message,
      message = _ref10$message === void 0 ? 'success' : _ref10$message,
      _ref10$data = _ref10.data,
      data = _ref10$data === void 0 ? undefined : _ref10$data,
      _ref10$page = _ref10.page,
      page = _ref10$page === void 0 ? 1 : _ref10$page,
      _ref10$limit = _ref10.limit,
      limit = _ref10$limit === void 0 ? 20 : _ref10$limit;
  return Object.assign({}, {
    code: code,
    message: message,
    data: data,
    page: page,
    limit: limit,
    size: data.length,
    hasMore: data.length === limit || false
  });
};

var LOGIN_AUTH_FAILED = function LOGIN_AUTH_FAILED() {
  var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref11$message = _ref11.message,
      message = _ref11$message === void 0 ? 'Username/Password error' : _ref11$message;

  return Object.assign({}, {
    code: 104,
    message: message
  });
};

var MALFORMED_REQUEST = {
  code: 400,
  message: 'Malformed Request. You might need to relogin.'
};
var REFRESH_TOKEN_MISMATCH = {
  code: 400,
  message: 'Refresh token mismatch.'
};
var OTP_TYPE_ERROR = {
  code: 108,
  message: 'Invalid OTP type.'
};

var NOTHING_MODIFIED = function NOTHING_MODIFIED() {
  var _ref12 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref12$message = _ref12.message,
      message = _ref12$message === void 0 ? 'Nothing modified' : _ref12$message;

  return {
    code: 105,
    message: message
  };
};

var INVALID_ACCESS_TOKEN = {
  code: 106,
  message: 'Invalid access token.'
};

var EMAIL_ALREADY_TAKEN = function EMAIL_ALREADY_TAKEN(_ref13) {
  var _ref13$message = _ref13.message,
      message = _ref13$message === void 0 ? 'This Email ID is already registered.' : _ref13$message;
  return {
    code: 107,
    message: message
  };
};

var EMAIL_ALREADY_VERIFIED = {
  code: 110,
  message: 'Your email is already verified.'
};
var TOKEN_NOT_VERIFIED = {
  code: 109,
  message: 'The token not verified.'
};
var TOKEN_TRY_EXPIRED = {
  code: 111,
  message: 'Verficiation code try has been expired. Request a new token.'
};
var TOKEN_EXPIRED = {
  code: 112,
  message: 'Your verification code has been expired. Token expires in 24 hours.'
};
var INVALID_VERIFICATION_CODE = {
  code: 113,
  message: 'Invlid URL provided for verification.'
};
var BROKEN_REFERENCE = {
  code: 114,
  message: 'Broken reference found'
};
var MISSING_REGION = {
  code: 115,
  message: 'Profile seems to have missing region data or you are trying to post in wrong region.'
};
var NOT_MEMBER_OF_GROUP = {
  code: 116,
  message: 'You are not part of this group.'
};
var ResponseUtility = {
  MISSING_PROPS: MISSING_PROPS,
  CONN_ERR: CONN_ERR,
  NO_USER: NO_USER,
  SUCCESS: SUCCESS,
  GENERIC_ERR: GENERIC_ERR,
  LOGIN_AUTH_FAILED: LOGIN_AUTH_FAILED,
  MALFORMED_REQUEST: MALFORMED_REQUEST,
  REFRESH_TOKEN_MISMATCH: REFRESH_TOKEN_MISMATCH,
  NOTHING_MODIFIED: NOTHING_MODIFIED,
  NUMBER_NOT_REGISTERED: NUMBER_NOT_REGISTERED,
  OTP_TYPE_ERROR: OTP_TYPE_ERROR,
  INVALID_ACCESS_TOKEN: INVALID_ACCESS_TOKEN,
  EMAIL_ALREADY_TAKEN: EMAIL_ALREADY_TAKEN,
  SUCCESS_PAGINATION: SUCCESS_PAGINATION,
  TOKEN_NOT_VERIFIED: TOKEN_NOT_VERIFIED,
  EMAIL_ALREADY_VERIFIED: EMAIL_ALREADY_VERIFIED,
  TOKEN_TRY_EXPIRED: TOKEN_TRY_EXPIRED,
  TOKEN_EXPIRED: TOKEN_EXPIRED,
  INVALID_VERIFICATION_CODE: INVALID_VERIFICATION_CODE,
  BROKEN_REFERENCE: BROKEN_REFERENCE,
  MISSING_REGION: MISSING_REGION,
  NOT_MEMBER_OF_GROUP: NOT_MEMBER_OF_GROUP
};
/**
 * Utility function that parses the acceptable input props and generate
 * the corresponding json object containing only the defined JSON properties.
 * Generally used by the update query to append only the defined json props.
 * @author gaurav sharma
 * @since Monday, September 28, 2018
 */

var schemaMapper = function schemaMapper(jsonObject) {
  return new Promise(function (resolve, reject) {
    var resultantObject = {};
    Object.keys(jsonObject).map(function (key, index) {
      if (jsonObject[key] !== undefined && key !== 'id') {
        resultantObject[key] = jsonObject[key];
      }

      if (index === Object.keys(jsonObject).length - 1) {
        if (Object.keys(resultantObject).length >= 1) {
          resolve(resultantObject);
        }

        reject(ResponseUtility.GENERIC_ERR({
          message: 'No defined field',
          error: 'There is no defined field in json Object. The resultant object is empty.'
        }));
      }
    });
  });
};
/**
 * @desc This module performs the time to millis conversion
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

/**
 * Converts the minutes into millis
 * @param {number} minutes -> number of minutes to convert to minutes
 */


var minutesToMillis = function minutesToMillis(minutes) {
  return minutes * 60000;
};
/**
 * Convert hours to millis
 * @param {number} hours -> number of hours to convert into millis
 */


var hoursToMillis = function hoursToMillis(hours) {
  return minutesToMillis(hours * 60);
};
/**
 * convert days to millis
 * @param {number} days -> number of days to convert to millis
 */


var daysToMillis = function daysToMillis(days) {
  return hoursToMillis(days * 24);
};
/**
 * returns the timestamp in Day Month Year, Hours:Minutes format.
 * @param {Number} timestamp
 */


var formatTimestamp = function formatTimestamp(timestamp) {
  var date = new Date(timestamp).toString();
  var splits = date.split(' ');
  var timeSplits = splits[4].split(':');
  var day = splits[2];
  var month = splits[1];
  var year = splits[3];
  var hours = timeSplits[0];
  var minutes = timeSplits[1];
  return "".concat(day, " ").concat(month, " ").concat(year, ", ").concat(hours, ":").concat(minutes);
};

var monthName = function monthName(month) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
};

var TimeConversionUtility = {
  minutesToMillis: minutesToMillis,
  hoursToMillis: hoursToMillis,
  daysToMillis: daysToMillis,
  formatTimestamp: formatTimestamp,
  monthName: monthName
};
/**
 * this module deals with the encoding and decoding of the generated tokens
 * using jsonwebtoken
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 *
 * @
 */

var secretString = process.env.SECRET_STRING;
/**
  * this will generate the jwt toke for the payload
  * by default, token will expire after an hour.
  * @param {*} payload the data to generate token from
  */

var generateToken = function generateToken(payload) {
  return jwt.sign({
    data: payload,
    exp: Date.now() + TimeConversionUtility.hoursToMillis(1)
  }, secretString);
};
/**
  * this will decode the input token to the corrsopoonding payload
  * @param {*} token to decode. To be referred from generateToken method
  */


var decodeToken = function decodeToken(token$$1) {
  return jwt.verify(token$$1, secretString, function (err, decoded) {
    if (err) {
      return undefined;
    }

    if (decoded.exp) {
      // if (new Date(decoded.exp).getTime() <= new Date().getTime()) {
      // 	return undefined;
      // }
      return decoded;
    }

    return undefined;
  });
};

var token = {
  generateToken: generateToken,
  decodeToken: decodeToken
};
/**
 * indexer for utility functions and objects
 * @author gaurav sharma
 * @since 28th September 2018
 */

/**
 * This service module deals with the sending of emails
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

var _process$env = process.env,
    BUSINESS_EMAIL = _process$env.BUSINESS_EMAIL,
    BUSINESS_EMAIL_PASSWORD = _process$env.BUSINESS_EMAIL_PASSWORD;
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: BUSINESS_EMAIL,
    pass: BUSINESS_EMAIL_PASSWORD
  }
});
/**
 * function to send mail
 * @param {String} to		-> send email to
 * @param {String} text		-> email content
 * @param {String} subject	-> subject of email
 */

var EmailServices = function EmailServices(_ref14) {
  var to = _ref14.to,
      text = _ref14.text,
      _ref14$subject = _ref14.subject,
      subject = _ref14$subject === void 0 ? 'Mail from tutable app' : _ref14$subject;
  return new Promise(function (resolve, reject) {
    transporter.sendMail({
      from: BUSINESS_EMAIL,
      to: to,
      text: text,
      subject: subject
    }, function (err) {
      if (err) {
        return reject(ResponseUtility.GENERIC_ERR({
          message: 'Error sending email.',
          error: err
        }));
      }

      return resolve(ResponseUtility.SUCCESS);
    });
  });
};
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


var multipart = function multipart(req, res, next) {
  var files = req.files,
      _req$body = req.body,
      data = _req$body.data,
      id = _req$body.id;
  req.body = data ? JSON.parse(data) : {};

  if (id) {
    req.body.id = id;
  }

  if (files && Object.keys(files).length) {
    Object.keys(files).map(function (fileKey) {
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


var DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL; // winston.add(Slack, options);

var requestsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({
    filename: './logs/request-info.log',
    level: 'info'
  })]
});
var responseLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({
    filename: './logs/response-info.log',
    level: 'info'
  })]
});
/**
  * Interceptor for the incoming request
  * @param {*} req
  * @param {*} res
  * @param {*} next
  */

var RequestInterceptor = function RequestInterceptor(req, res, next) {
  var body = req.body,
      headers = req.headers,
      path$$1 = req.path;
  var data = new Object(body);
  data.format = 'request';
  data.path = path$$1;
  data.headers = headers;
  data.timestamp = new Date();
  requestsLogger.log({
    level: 'info',
    message: data
  });
  next();
}; // const SlackRequestInterceptor = (req, res, next) => {
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


var ResponseInterceptor = function ResponseInterceptor(req, res, next) {
  var send = res.send;

  res.send = function (body) {
    var data = new Object(body);
    data.format = 'response';
    data.timestamp = new Date();
    responseLogger.log({
      level: 'info',
      message: data
    });
    send.call(this, body);
  };

  next();
}; // const SlackResponseInterceptor = (req, res, next) => {
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


var ActivateExceptionLogs = function ActivateExceptionLogs() {
  process.on('uncaughtException',
  /*#__PURE__*/
  function () {
    var _ref15 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(err) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return EmailServices({
                to: DEVELOPER_EMAIL,
                text: err.stack,
                subject: 'Uncaught Exception in urbankiddie.'
              });

            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x) {
      return _ref15.apply(this, arguments);
    };
  }());
  process.on('unhandledRejection',
  /*#__PURE__*/
  function () {
    var _ref16 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(err) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return EmailServices({
                to: DEVELOPER_EMAIL,
                text: err.stack,
                subject: 'Unhandled promise rejection in urbankiddie.'
              });

            case 2:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x2) {
      return _ref16.apply(this, arguments);
    };
  }());
};

var logger = {
  ResponseInterceptor: ResponseInterceptor,
  RequestInterceptor: RequestInterceptor,
  // SlackRequestInterceptor,
  // SlackResponseInterceptor,
  ActivateExceptionLogs: ActivateExceptionLogs
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

var _process$env2 = process.env,
    AWS_ACCESSID = _process$env2.AWS_ACCESSID,
    AWS_SECRET = _process$env2.AWS_SECRET,
    S3_BUCKET = _process$env2.S3_BUCKET;
var s3 = new AWS.S3({
  accessKeyId: AWS_ACCESSID,
  secretAccessKey: AWS_SECRET,
  Bucket: S3_BUCKET
});
var s3$1 = {
  /**
    * Upload a file to s3 bucket
    * @param {string} bucket	-> refers to the name of the bucket
    * @param {object} file	-> refers to the file object to upload
    */
  uploadToBucket: function uploadToBucket(_ref17) {
    var Bucket = _ref17.Bucket,
        data = _ref17.data,
        Key = _ref17.Key;
    return new Promise(function (resolve, reject) {
      if (Bucket && data && Key) {
        var params = {
          Bucket: Bucket,
          Key: Key,
          Body: data
        };
        s3.upload(params, function (err, uploadResponse) {
          if (err) {
            reject(ResponseUtility.GENERIC_ERR({
              message: 'Error uploading file',
              error: err
            }));
          } else {
            resolve(ResponseUtility.SUCCESS({
              data: uploadResponse
            }));
          }
        });
      } else {
        reject(ResponseUtility.MISSING_PROPS());
      }
    });
  },
  uploadPublicObject: function uploadPublicObject(_ref18) {
    var Bucket = _ref18.Bucket,
        data = _ref18.data,
        Key = _ref18.Key,
        mime = _ref18.mime;
    return new Promise(function (resolve, reject) {
      if (Bucket && data && Key) {
        var params = {
          ACL: 'public-read',
          Bucket: Bucket,
          Key: Key,
          Body: data,
          ContentType: mime
        };
        s3.putObject(params, function (err, response) {
          if (err) {
            reject(ResponseUtility.GENERIC_ERR({
              message: 'Error uploading file',
              error: err
            }));
          } else {
            resolve(ResponseUtility.SUCCESS({
              data: response
            }));
          }
        });
      } else {
        reject(ResponseUtility.MISSING_PROPS());
      }
    });
  },
  uploadLocalFile: function uploadLocalFile(_ref19) {
    var Key = _ref19.Key,
        Bucket = _ref19.Bucket;
    return new Promise(function (resolve, reject) {
      fs.readFile(path.resolve(LOCAL_IMAGE_PATH, Key), function (err, Body) {
        if (err) {
          reject(ResponseUtility.GENERIC_ERR({
            message: 'Cannot read local file',
            error: err
          }));
        } else {
          s3.putObject({
            Bucket: Bucket,
            Key: Key,
            Body: Body
          }, function (putError, data) {
            if (putError) {
              reject(ResponseUtility.GENERIC_ERR({
                message: 'Error saving image to s3',
                error: putError
              }));
            } else {
              resolve(ResponseUtility.SUCCESS({
                data: data
              }));
            }
          });
        }
      });
    });
  },

  /**
    * Save the buffer image on s3
    */
  putBuffer: function putBuffer(_ref20) {
    var Bucket = _ref20.Bucket,
        Body = _ref20.Body,
        Key = _ref20.Key;
    return new Promise(function (resolve, reject) {
      s3.putObject({
        Body: Body,
        Bucket: Bucket,
        Key: Key
      }, function (err, data) {
        if (err) {
          reject(ResponseUtility.GENERIC_ERR({
            message: 'Error uploading image to s3',
            error: err
          }));
        } else {
          resolve(ResponseUtility.SUCCESS({
            data: data
          }));
        }
      });
    });
  },

  /**
    * @desc Find a file in s3 bucket
    * @param {String} bucket	-> name of bucket
    * @param {String} key		-> name of file
    */
  findFile: function findFile(_ref21) {
    var Bucket = _ref21.Bucket,
        Key = _ref21.Key;
    return new Promise(function (resolve, reject) {
      var params = {
        Bucket: Bucket,
        Key: Key
      };
      s3.getObject(params, function (err, object) {
        if (err) {
          reject(ResponseUtility.GENERIC_ERR({
            messafe: 'Error looking for file',
            error: err
          }));
        } else {
          resolve(ResponseUtility.SUCCESS({
            data: object
          }));
        }
      });
    });
  },

  /**
    * Remove the requested file
    * @param {String} Bucket	-> the name of bucket to look for file
    * @param {String} Key		-> the file name to delete
    */
  removeFile: function removeFile(_ref22) {
    var Bucket = _ref22.Bucket,
        Key = _ref22.Key;
    return new Promise(function (resolve, reject) {
      if (Bucket && Key) {
        var params = {
          Bucket: Bucket,
          Key: Key
        };
        s3.deleteObject(params, function (err) {
          if (err) {
            reject(ResponseUtility.GENERIC_ERR({
              message: 'Error deleting object',
              error: err
            }));
          } else {
            resolve(ResponseUtility.SUCCESS);
          }
        });
      } else {
        reject(ResponseUtility.MISSING_PROPS());
      }
    });
  },

  /**
   * @desc this function creates a new folder inside a bucket
   * @param {String} Bucket	-> the bucket to create a folder in
   * @param {String} Key		-> the name of the folder to create
   */
  createFolderInsideBucket: function createFolderInsideBucket(_ref23) {
    var Bucket = _ref23.Bucket,
        Key = _ref23.Key;
    return new Promise(function (resolve, reject) {
      var params = {
        Bucket: Bucket,
        Key: Key
      };
      s3.putObject(params, function (err) {
        if (err) {
          reject(ResponseUtility.GENERIC_ERR({
            message: 'Error creating bucket',
            error: err
          }));
        } else {
          resolve(ResponseUtility.SUCCESS);
        }
      });
    });
  },

  /**
   * API to list down the bucket content
   * @param {String} bucket	-> the name of the bucket
   * @param {String} Folder	-> name of the folder to fetch data from
   */
  listBucketContent: function listBucketContent(_ref24) {
    var Bucket = _ref24.Bucket,
        Folder = _ref24.Folder;
    return new Promise(function (resolve, reject) {
      var params = {
        Bucket: Bucket,
        Prefix: "".concat(Folder, "/")
      };
      s3.listObjects(params, function (err, objects) {
        if (err) {
          reject(ResponseUtility.GENERIC_ERR({
            message: 'Error finding the bucket content',
            error: err
          }));
        } else {
          objects.Contents.splice(0, 1);
          var files = [];
          objects.Contents.map(function (object) {
            var Key = object.Key;
            var generateURL = "/owner/getClubPicture/".concat(Key);
            files.push(generateURL);
          });
          resolve(ResponseUtility.SUCCESS({
            data: files
          }));
        }
      });
    });
  },
  S3: s3
};
/**
 * @desc The module containing the stripe related functionality
 * to handle the stripe payments
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
var stripe = new Stripe(STRIPE_SECRET_KEY);
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

var CreateUser = function CreateUser(_ref25) {
  var email = _ref25.email,
      id = _ref25.id,
      card = _ref25.card;
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref26 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3(resolve, reject) {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if ((email || id) && card) {
                stripe.customers.create({
                  email: email || id,
                  description: "Stripe details for ".concat(email || id, " customer"),
                  source: card
                }).then(function (success) {
                  var object = {
                    altered: success,
                    raw: success
                  };
                  resolve(object);
                }).catch(function (err) {
                  return reject(err);
                });
              } else {
                reject(ResponseUtility.MISSING_REQUIRED_PROPS);
              }

            case 1:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function (_x3, _x4) {
      return _ref26.apply(this, arguments);
    };
  }());
};
/**
 * remove the requested card from the list
 *@see https://stripe.com/docs/api#delete_card
 * @param {*} param0
 */


var RemoveCard = function RemoveCard(_ref27) {
  var customerId = _ref27.customerId,
      cardId = _ref27.cardId;
  return new Promise(function (resolve, reject) {
    // console.log(customerId, cardId);
    if (customerId && cardId) {
      stripe.customers.deleteCard(customerId, cardId).then(function (success) {
        resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_REQUIRED_PROPS);
    }
  });
};
/**
 * delete an external stripe account
 * This is invoked when a suer requests ot remove a linked banked
 * account with the external account.
 * @param {*} param0
 */


var RemoveExternalAccount = function RemoveExternalAccount(_ref28) {
  var accountId = _ref28.accountId,
      bankId = _ref28.bankId;
  return new Promise(function (resolve, reject) {
    if (accountId) {
      stripe.accounts.deleteExternalAccount(accountId, bankId).then(function (success) {
        return resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_REQUIRED_PROPS);
    }
  });
};
/**
 * accept the new bank account details and replace it with the new ones
 * @param {*} param0
 */


var UpdateExternalAccount = function UpdateExternalAccount(_ref29) {
  var accountId = _ref29.accountId,
      externalAccount = _ref29.externalAccount;
  return new Promise(function (resolve, reject) {
    if (accountId && externalAccount) {
      stripe.accounts.update(accountId, {
        external_account: externalAccount
      }).then(function (success) {
        return resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_REQUIRED_PROPS);
    }
  });
};
/**
 * Create a new bank user
 */


var CreateBankUser = function CreateBankUser(_ref30) {
  var email = _ref30.email,
      token$$1 = _ref30.token,
      _ref30$personalDetail = _ref30.personalDetails,
      _ref30$personalDetail2 = _ref30$personalDetail.address,
      city = _ref30$personalDetail2.city,
      country = _ref30$personalDetail2.country,
      line1 = _ref30$personalDetail2.line1,
      postal = _ref30$personalDetail2.postal,
      state = _ref30$personalDetail2.state,
      _ref30$personalDetail3 = _ref30$personalDetail.dob,
      day = _ref30$personalDetail3.day,
      month = _ref30$personalDetail3.month,
      year = _ref30$personalDetail3.year,
      firstName = _ref30$personalDetail.firstName,
      lastName = _ref30$personalDetail.lastName,
      type = _ref30$personalDetail.type,
      ip = _ref30$personalDetail.ip,
      verificationDocumentData = _ref30.verificationDocumentData;
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref31 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee4(resolve, reject) {
      var account, id, updatedAccount, upload, attach, response;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!(email && token$$1 && city && line1 && postal && state && day && month && year && firstName && lastName && type && ip)) {
                _context4.next = 24;
                break;
              }

              _context4.next = 3;
              return stripe.account.create({
                type: 'custom',
                country: 'AU',
                email: email
              });

            case 3:
              account = _context4.sent;

              if (!account) {
                _context4.next = 22;
                break;
              }

              id = account.id;
              _context4.next = 8;
              return stripe.accounts.update(id, {
                external_account: token$$1,
                tos_acceptance: {
                  date: Math.floor(Date.now() / 1000),
                  ip: ip
                },
                legal_entity: {
                  address: {
                    city: city,
                    country: country,
                    line1: line1,
                    postal_code: postal,
                    state: state
                  },
                  first_name: firstName,
                  last_name: lastName,
                  type: type,
                  dob: {
                    day: day,
                    month: month,
                    year: year
                  }
                }
              });

            case 8:
              updatedAccount = _context4.sent;

              if (!updatedAccount) {
                _context4.next = 21;
                break;
              }

              _context4.next = 12;
              return stripe.fileUploads.create({
                purpose: 'identity_document',
                file: {
                  data: verificationDocumentData,
                  name: '',
                  type: 'application/octect-stream'
                }
              }, {
                stripe_account: id
              });

            case 12:
              upload = _context4.sent;
              _context4.next = 15;
              return stripe.accounts.update(id, {
                legal_entity: {
                  verification: {
                    document: upload.id
                  }
                }
              });

            case 15:
              attach = _context4.sent;
              console.log(attach); // added an partner account with bank account.

              response = {
                altered: {
                  id: updatedAccount.id,
                  default_source: updatedAccount.external_accounts.data[0].id
                },
                raw: updatedAccount
              };
              resolve(response);
              _context4.next = 22;
              break;

            case 21:
              reject(ResponseUtility.GENERIC_ERR({
                message: 'Erro adding external account to the created partner account '
              }));

            case 22:
              _context4.next = 25;
              break;

            case 24:
              reject(ResponseUtility.MISSING_REQUIRED_PROPS);

            case 25:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    return function (_x5, _x6) {
      return _ref31.apply(this, arguments);
    };
  }());
};
/**
 * create a new payment for the provided source. Handle respective errror
 * @param {Number} amount
 * @param {String} currency
 * @param {String} source the id of the card
 * @param {String} description
 */


var CreatePayment = function CreatePayment(_ref32) {
  var amount = _ref32.amount,
      _ref32$currency = _ref32.currency,
      currency = _ref32$currency === void 0 ? 'AUD' : _ref32$currency,
      source = _ref32.source,
      customer = _ref32.customer,
      description = _ref32.description;
  return new Promise(function (resolve, reject) {
    if (amount && currency && source) {
      stripe.charges.create({
        amount: amount,
        currency: currency,
        source: source,
        customer: customer,
        description: description
      }).then(function (success) {
        return resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_REQUIRED_PROPS);
    }
  });
};
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


var HandlePayout = function HandlePayout(_ref33) {
  var amount = _ref33.amount,
      description = _ref33.description,
      destination = _ref33.destination,
      sourceType = _ref33.sourceType;
  return new Promise(function (resolve, reject) {
    /**
     * @todo handle payouts implementation
     */
    if (amount && description && destination) {
      stripe.transfers.create({
        amount: amount,
        destination: destination,
        currency: 'aud',
        transfer_group: 'TEST_TRANSFERS'
      }).then(function (success) {
        return resolve(ResponseUtility.SUCCESS({
          data: success
        }));
      }).catch(function (err) {
        return reject(ResponseUtility.GENERIC_ERR({
          message: '',
          error: err
        }));
      });
    }
  });
};
/**
 * cerate a customer account to handle payouts
 * @see https://stripe.com/docs/api/node#create_account
 * @param {String} email
 */


var CreateCustomAccount = function CreateCustomAccount(_ref34) {
  var email = _ref34.email;
  return new Promise(function (resolve, reject) {
    stripe.accounts.create({
      type: 'custom',
      country: 'AU',
      email: email
    }).then(function (account) {
      resolve(account);
    }).catch(function (err) {
      return reject(err);
    });
  });
};
/**
 * add externa account to a stripe connect account.
 * use the stripe account update function to add external account
 */


var AddExternalAccount = function AddExternalAccount(_ref35) {
  var account = _ref35.account,
      businessName = _ref35.businessName,
      token$$1 = _ref35.token;
  return new Promise(function (resolve, reject) {
    if (account && (businessName || token$$1)) {
      stripe.accounts.update(account, {
        business_name: businessName,
        external_account: token$$1
      }).then(function (success) {
        resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_REQUIRED_PROPS);
    }
  });
};
/**
 * process the refeund based on the incurred charge
 * @param {String} chargeId the id of the charge to process refund.
 * @param {Number} amount if defined, the amount of money will be refunded, By deducting some charges
 */


var ProcessRefund = function ProcessRefund(_ref36) {
  var chargeId = _ref36.chargeId,
      amount = _ref36.amount;
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref37 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5(resolve, reject) {
      var chargeResponse, response;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (!(!chargeId && !amount)) {
                _context5.next = 2;
                break;
              }

              return _context5.abrupt("return", reject(ResponseUtility.MISSING_REQUIRES_PROPS));

            case 2:
              if (!amount) {
                _context5.next = 13;
                break;
              }

              _context5.prev = 3;
              _context5.next = 6;
              return stripe.refunds.create({
                charge: chargeId,
                amount: amount
              });

            case 6:
              chargeResponse = _context5.sent;
              return _context5.abrupt("return", resolve(chargeResponse));

            case 10:
              _context5.prev = 10;
              _context5.t0 = _context5["catch"](3);
              return _context5.abrupt("return", reject(_context5.t0));

            case 13:
              _context5.prev = 13;
              _context5.next = 16;
              return stripe.refunds.create({
                charge: chargeId
              });

            case 16:
              response = _context5.sent;
              resolve(response);
              _context5.next = 23;
              break;

            case 20:
              _context5.prev = 20;
              _context5.t1 = _context5["catch"](13);
              // console.log(err);
              reject(_context5.t1);

            case 23:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this, [[3, 10], [13, 20]]);
    }));

    return function (_x7, _x8) {
      return _ref37.apply(this, arguments);
    };
  }());
};

var stripe$1 = {
  stripe: stripe,
  CreateUser: CreateUser,
  CreatePayment: CreatePayment,
  HandlePayout: HandlePayout,
  CreateCustomAccount: CreateCustomAccount,
  AddExternalAccount: AddExternalAccount,
  CreateBankUser: CreateBankUser,
  ProcessRefund: ProcessRefund,
  RemoveCard: RemoveCard,
  RemoveExternalAccount: RemoveExternalAccount,
  UpdateExternalAccount: UpdateExternalAccount
};
/**
 * This service module deals with the sending of template emails
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

var _process$env3 = process.env,
    HOST = _process$env3.HOST,
    BUSINESS_EMAIL$1 = _process$env3.BUSINESS_EMAIL,
    BUSINESS_EMAIL_PASSWORD$1 = _process$env3.BUSINESS_EMAIL_PASSWORD;
var transporter$1 = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: BUSINESS_EMAIL$1,
    pass: BUSINESS_EMAIL_PASSWORD$1
  }
});
/**
 * function to send mail
 * @param {String} to		-> send email to
 * @param {String} text		-> email content
 * @param {String} subject	-> subject of email
 */

var sendMail = function sendMail(_ref38) {
  var to = _ref38.to,
      _ref38$subject = _ref38.subject,
      subject = _ref38$subject === void 0 ? 'Mail from UrbankKiddie app' : _ref38$subject,
      html = _ref38.html;
  return new Promise(function (resolve, reject) {
    // read html file here
    transporter$1.sendMail({
      from: BUSINESS_EMAIL$1,
      to: to,
      html: html,
      subject: subject
    }, function (err) {
      if (err) {
        return reject(ResponseUtility.GENERIC_ERR({
          message: 'Error sending email.',
          error: err
        }));
      }

      return resolve(ResponseUtility.SUCCESS());
    });
  });
};
/**
 * send this email template for now account registering
 * @param {String} to, email of the user to send email
 * @param {String} name of the recipient (for salutation)
 * @param {Number} verificationCode to send the generated verification token
 * @param {String} templatePath path to the template file
 */


var NewAccountMail = function NewAccountMail(_ref39) {
  var to = _ref39.to,
      name = _ref39.name,
      verificationCode = _ref39.verificationCode,
      _ref39$templatePath = _ref39.templatePath,
      templatePath = _ref39$templatePath === void 0 ? path.resolve(__dirname, 'templates', 'new_account_template.html') : _ref39$templatePath;
  return new Promise(function (resolve, reject) {
    var html = fs.readFileSync(templatePath, {
      encoding: 'utf-8'
    });
    var template = handlebars.compile(html);
    var props = {
      user_name: name,
      verification_code: verificationCode
    };
    var compiled = template(props);
    sendMail({
      to: to,
      subject: 'New account created',
      html: compiled
    }).then(function (success) {
      return resolve(success);
    }).catch(function (err) {
      return reject(err);
    });
  });
};
/**
 * the send the hange password email.
 * @param {String} to, email of the user to send email
 * @param {String} name of the recipient (for salutation)
 * @param {Number} code to send for verification
 * @param {String} templatePath path to the template file
 */


var ChangePasswordToken = function ChangePasswordToken(_ref40) {
  var to = _ref40.to,
      name = _ref40.name,
      code = _ref40.code,
      _ref40$templatePath = _ref40.templatePath,
      templatePath = _ref40$templatePath === void 0 ? path.resolve(__dirname, 'templates', 'new_account_template.html') : _ref40$templatePath;
  return new Promise(function (resolve, reject) {
    if (to && name && code) {
      var html = fs.readFileSync(templatePath, {
        encoding: 'utf-8'
      });
      var template = handlebars.compile(html);
      var props = {
        user_name: name,
        verification_code: code
      };
      var compiled = template(props);
      sendMail({
        to: to,
        subject: 'Password Reset Request',
        html: compiled
      }).then(function (success) {
        return resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_PROPS());
    }
  });
};
/**
 * @param {String} to, email of the user to send email
 * @param {String} name of the recipient (for salutation)
 * @param {Number} code the new generated code
 * @param {String} templatePath path to the template file
*/


var VerificationToken = function VerificationToken(_ref41) {
  var to = _ref41.to,
      name = _ref41.name,
      code = _ref41.code,
      _ref41$templatePath = _ref41.templatePath,
      templatePath = _ref41$templatePath === void 0 ? path.resolve(__dirname, 'templates', 'new_account_template.html') : _ref41$templatePath;
  return new Promise(function (resolve, reject) {
    if (to && name && code) {
      var html = fs.readFileSync(templatePath, {
        encoding: 'utf-8'
      });
      var template = handlebars.compile(html); // replace code with the URL

      var verificationCodeUrl = "".concat(HOST, "users/mailVerification/").concat(to, "/").concat(code);
      var props = {
        user_name: name,
        verification_code: verificationCodeUrl
      };
      var compiled = template(props);
      sendMail({
        to: to,
        subject: 'Verify your Email for urbankiddie Account',
        html: compiled
      }).then(function (success) {
        return resolve(success);
      }).catch(function (err) {
        return reject(err);
      });
    } else {
      reject(ResponseUtility.MISSING_PROPS());
    }
  });
};

var templateMail = {
  NewAccountMail: NewAccountMail,
  ChangePasswordToken: ChangePasswordToken,
  VerificationToken: VerificationToken
};
/**
 * @desc This moudle handles the twilio sending message services.
 * Exposes the utility method for twilio to send messages.
 * @author gaurav sharma
 */

var client;
var _process$env4 = process.env,
    TWILIO_ACCOUNT_SID = _process$env4.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN = _process$env4.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE = _process$env4.TWILIO_PHONE;
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

var sendMessage = function sendMessage(_ref42) {
  var messageTo = _ref42.messageTo,
      _ref42$messageFrom = _ref42.messageFrom,
      messageFrom = _ref42$messageFrom === void 0 ? TWILIO_PHONE : _ref42$messageFrom,
      message = _ref42.message;
  return new Promise(function (resolve, reject) {
    client.messages.create({
      to: messageTo,
      from: messageFrom,
      body: message
    }, function (err, response) {
      if (err) {
        return reject(err);
      }

      return resolve(response.sid);
    });
  });
};

var twilio$1 = function twilio$1(_ref43) {
  var messageTo = _ref43.messageTo,
      message = _ref43.message;
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref44 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee6(resolve, reject) {
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (!(!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE)) {
                _context6.next = 4;
                break;
              }

              throw new Error('Twilio Credentials Missing');

            case 4:
              client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

            case 5:
              _context6.prev = 5;
              _context6.next = 8;
              return sendMessage({
                messageTo: messageTo,
                message: message
              });

            case 8:
              return _context6.abrupt("return", resolve({
                code: 100,
                message: 'success'
              }));

            case 11:
              _context6.prev = 11;
              _context6.t0 = _context6["catch"](5);
              return _context6.abrupt("return", reject({
                code: 104,
                message: 'Error sending OTP message.',
                error: _context6.t0
              }));

            case 14:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this, [[5, 11]]);
    }));

    return function (_x9, _x10) {
      return _ref44.apply(this, arguments);
    };
  }());
};
/**
 * This service will checkt he requested token by making HTTP call to facebook
 * graph API and fetches the user detals.
 *
 * @param {String} accessToken to verify
 */


var verifyFacebookToken = function verifyFacebookToken(_ref45) {
  var accessToken = _ref45.accessToken;
  return new Promise(function (resolve, reject) {
    if (!accessToken) {
      return reject(ResponseUtility.ERROR({
        message: 'Missing required props accessToken.'
      }));
    }

    request.get("https://graph.facebook.com/me?access_token=".concat(accessToken), function (err, response, body) {
      if (err) {
        return reject(ResponseUtility.ERROR({
          message: 'Error validating token',
          error: err
        }));
      }

      if (response.statusCode === 200) {
        var queryResponse = JSON.parse(response.body);
        return resolve(ResponseUtility.SUCCESS({
          data: _objectSpread({}, queryResponse)
        }));
      }

      return reject(ResponseUtility.INVALID_ACCESS_TOKEN);
    });
  });
};
/**
 * @desc handle multipart as array of buffers
 * for multiple files
 * @author gaurav sharma
 * @since 17nd November 2018
 * Adapted while Faraya Application
 */


var mergingMultipart = function mergingMultipart(req, res, next) {
  var files = req.files,
      _req$body2 = req.body,
      data = _req$body2.data,
      id = _req$body2.id;
  req.body = data ? JSON.parse(data) : {};

  if (id) {
    req.body.id = id;
  }

  if (files && Object.keys(files).length) {
    Object.keys(files).map(function (fileKey) {
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


var propsInjection = function propsInjection(property) {
  var safeKeys = ['id'];
  return function (req, res, next) {
    var _req$body3 = req.body,
        data = _req$body3.data,
        id = _req$body3.id,
        body = req.body;
    req.body = data ? JSON.parse(data) : body ? body : {};

    if (id) {
      req.body.id = id;
    }

    Object.keys(property).map(function (key) {
      if (!safeKeys.includes(key)) {
        req.body[key] = property[key];
      }
    });
    next();
  };
};
/**
 * indexer for the application services
 * @author gaurav sharma
 * @since 28th September 2018
 */

/**
 * This will export all the required packages.
 * Acts as an indexer
 *
 * @author gaurav sharma
 * @since 28th september 2018
 * @license AppKnit
 */


exports.EmailServices = EmailServices;
exports.MultipartService = multipart;
exports.LogServices = logger;
exports.S3Services = s3$1;
exports.StripeServices = stripe$1;
exports.TemplateMailServices = templateMail;
exports.MessagingService = twilio$1;
exports.VerifyFacebookTokenService = verifyFacebookToken;
exports.MergingMultipartService = mergingMultipart;
exports.PropsInjectionService = propsInjection;
exports.HashUtility = hash;
exports.PropsValidationUtility = propsValidation;
exports.RandomCodeUtility = randomCode;
exports.ResponseUtility = ResponseUtility;
exports.SchemaMapperUtility = schemaMapper;
exports.TimeConversionUtility = TimeConversionUtility;
exports.TokenUtility = token;