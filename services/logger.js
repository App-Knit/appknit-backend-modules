/**
 * @desc This module contains the logger service for the application urbankiddie.
 * The logging service is a middleware.
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

import { createLogger, format, transports } from 'winston';
import { Slack } from 'slack-winston';
import { EmailServices } from '.';

// winston.add(Slack, options);

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

const SlackRequestInterceptor = (req, res, next) => {
	const { body, headers, path } = req;
	const data = new Object(body);
	data.format = 'request';
	data.headers = headers;
	data.timestamp = new Date();

	createLogger({
		level: 'info',
		format: format.json(),
		transports: new Slack({
			domain: '',
			token: 'xoxp-406560551137-406399972208-407767326723-6b9e11a7c98636645f13c48eef65c382',
			webhook_url: 'https://hooks.slack.com/services/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',
			channel: 'request-log',
			level: 'info',
		}),
	}).log({ level: 'info', message: data });
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

const SlackResponseInterceptor = (req, res, next) => {
	const { send } = res;
	res.send = function (body) {
		const data = new Object(body);
		data.format = 'response';
		data.timestamp = new Date();
		// winston.log({ level: 'info', message: data });
		createLogger({
			level: 'info',
			format: format.json(),
			transports: new Slack({
				domain: '',
				token: 'xoxp-406560551137-406399972208-407767326723-6b9e11a7c98636645f13c48eef65c382',
				webhook_url: 'https://hooks.slack.com/services/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',
				channel: 'response-log',
				level: 'info',
			}),
		}).log({ level: 'info', message: data });
		send.call(this, body);
	};
	next();
};

/**
 * activate the exeption logs
 * @todo test this functionality
 */
const ActivateExceptionLogs = () => {
	process.on('uncaughtException', async (err) => {
		await EmailServices({ to: 'sharma02gaurav@gmail.com', text: err.stack, subject: 'Uncaught Exception in urbankiddie.' });
	});

	process.on('unhandledRejection', async (err) => {
		await EmailServices({ to: 'sharma02gaurav@gmail.com', text: err.stack, subject: 'Unhandled promise rejection in urbankiddie.' });
	});
};

export default {
	ResponseInterceptor,
	RequestInterceptor,
	SlackRequestInterceptor,
	SlackResponseInterceptor,
	ActivateExceptionLogs,
};
