/**
 * @desc This module generates a random code on request
 * @author gurlal
 * @since August 3, 2019
 * @param {String} length the length of random code reqired.
 * @param {String} type the type of random code that can be one of
 * the following three:
 * 1. num: numerical
 * 2. alpha: alphabetical.
 * 3. alphaNum: alphanumerical.
 */
export default (length = 6, type = 'num') => {
	let random = '';
	const alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	const num = '0123456789';
	let charactersLength;
	let characters;
	switch (type) {
		case 'num':
			charactersLength = num.length;
			characters = num;
			break;
		case 'alpha':
			charactersLength = alpha.length;
			characters = alpha;
			break;
		case 'alphaNum':
			charactersLength = alphaNum.length;
			characters = alphaNum;
			break;
		default:
			type = 'num';
			charactersLength = num.length;
			characters = num;
			break;
	}
	for (let i = 0; i < length; i++) {
		random += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	(type == 'num') ? random = parseInt(random) : 0;
	return random;
};
