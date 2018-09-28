/**
 * @desc the passport service module
 * @author gaurav sharma
 */
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { TokenUtility } from '../utility';

/**
 * serialize the generated access token
 */
passport.serializeUser((token, done) => done(undefined, token));
/**
 * deserialize the generated token
 */
passport.deserializeUser((token, done) => {
	const payload = TokenUtility.decodeToken(token);
	done(undefined, payload);
});

/**
* @todo you can add as many passport services as you like.
* You can also include other login services like google, facebook etc login services
*/
passport.use('UserLogin', new LocalStrategy((username, password, done) => {
	if (username && password) {
		/**
		* @todo call your authentication function here...
		* uncomment the below code and add your custom authentication
		*/
		const query = { email: username, password };
		/**
		 * @todo handle the login flow here...
		 */
		// UserModel.UserAuthenticateService(query)
		// 	.then((success) => {
		// 		const { id, email, role } = success;
		// 		const refactoredUser = Object.assign({}, { id, email, role });
		// 		done(undefined, { code: 100, message: 'Authenticated', accessToken: TokenUtility.generateToken(refactoredUser) });
		// 	}).catch(err => done({ code: 102, message: 'Username/password is incorrect', error: err }));
	} else {
		done(null, false, { message: 'Missing required properties.' });
	}
}));

export const UserLoginHandler = (req, res, next) => {
	passport.authenticate('UserLogin', (err, user, info) => {
		if (user) {
			res.status(200).send(user);
		} else {
			res.status(200).send(err);
		}
	})(req, res, next);
};

/**
* @todo you can add as many user login handlers as possible
*/

export default {
	passport,
	UserLoginHandler,
};
