import rateLimit from 'express-rate-limit';

export default (timeLimit, requestLimit, message) => rateLimit({
	windowMs: timeLimit, // time frame
	max: requestLimit, // number of requests allowed for set time frame
	message, // message to show if request limit exceeds
});
