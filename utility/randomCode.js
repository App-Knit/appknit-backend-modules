/**
 * @desc This module generates a random code on request
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */
export default (digits = 6) => {
	const factor = 10 ** digits;	// exponential
	let random = Math.ceil(Math.random() * factor);
	if (random.toString().length < digits) {
		const diff = 10 ** ((digits - random.toString().length) + 1);
		random += diff;
	}
	return random;
};
