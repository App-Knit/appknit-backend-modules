/**
 * this module deals with the encoding and decoding of the generated tokens
 * using jsonwebtoken
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

import jwt from 'jsonwebtoken';

const secretString = process.env.SECRET_STRING;
/**
  * this will generate the jwt toke for the payload
  * by default, token will expire after an hour.
  * @param {*} payload the data to generate token from
  */
const generateToken = payload => jwt.sign(
	{ data: payload },
	secretString,
	payload.tokenLife && { expiresIn: payload.tokenLife },
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

export default {
	generateToken,
	decodeToken,
};
