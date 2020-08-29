/**
 * @desc This module contains the logger service for the application urbankiddie.
 * The logging service is a middleware.
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

import { createLogger, format, transports } from 'winston';
import { EmailServices } from '.';

const {
	DEVELOPER_EMAIL,
} = process.env;

const requestsLogger = createLogger({
	level: 'info',
	format: format.json(),
	transports: [
		new transports.File({ filename: './logs/request-info.log', level: 'info' }),
	],
});
const responseLogger = createLogger({
	level: 'info',
	format: format.json(),
	transports: [
		new transports.File({ filename: './logs/response-info.log', level: 'info' }),
	],
});

const consoleLogger = createLogger({
	level: 'info',
	format: format.json(),
	transports: [
		new transports.Console({ level: 'info' })
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

const RequestInterceptorConsole = (req, res, next) => {
	const { body, headers, path } = req;
	const data = new Object(body);
	data.format = 'request';
	data.path = path;
	data.headers = headers;
	data.timestamp = new Date();

	consoleLogger.log({ level: 'info', message: data });
	next();
}

const ResponseInterceptorConsole = (req, res, next) => {
	const { send } = res;
	res.send = function(body) {
		const data = new Object(body);
		data.format = 'response';
		data.timestamp = new Date().toUTCString();
		consoleLogger.log({ level: 'info', message: data });
		send.call(this, body);
	}
}
const _commonLogger = (type, message) => console[type](`${new Date().toUTCString()}: ${JSON.stringify(message)}`);

const logger = {
	info: message => _commonLogger('log', message),
	error: message => _commonLogger('error', message),
	warn: message => _commonLogger('warn', message),
}

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

export default {
	ResponseInterceptor,
	RequestInterceptor,
	RequestInterceptorConsole,
	ResponseInterceptorConsole,
	ActivateExceptionLogs,
	logger,
};
