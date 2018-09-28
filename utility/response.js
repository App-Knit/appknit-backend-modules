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

export default {
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
