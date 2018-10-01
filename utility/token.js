/**
 * this module deals with the encoding and decoding of the generated tokens
 * using jsonwebtoken
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 *
 * @
 */

import jwt from 'jsonwebtoken';
import { TimeConversionUtility } from '.';

const secretString = process.env.SECRET_STRING;
/**
  * this will generate the jwt toke for the payload
  * by default, token will expire after an hour.
  * @param {*} payload the data to generate token from
  */
const generateToken = payload => jwt.sign({ data: payload, exp: Date.now() + TimeConversionUtility.hoursToMillis(1) }, secretString);
/**
  * this will decode the input token to the corrsopoonding payload
  * @param {*} token to decode. To be referred from generateToken method
  */
const decodeToken = token => jwt.verify(token, secretString, (err, decoded) => {
	if (err) {
		return undefined;
	} if (decoded.exp) {
		// if (new Date(decoded.exp).getTime() <= new Date().getTime()) {
		// 	return undefined;
		// }
		return decoded;
	}
	return undefined;
});

export default {
	generateToken,
	decodeToken,
};
