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
 * @author garurav sharma
 * @since 28th September 2018
 */
import bcrypt from 'bcrypt';

export default {
	/**
	 * @param {String} text
	 * @param {Number} iterations. Defaults to 10
	 */
	generate: ({ text, iterations = 10 }) => new Promise((resolve, reject) => {
		bcrypt.hash(text, iterations, (err, hash) => {
			return err ? reject(err) : resolve(hash);
		});
	}),
	/**
	 * @param {String} hash
	 * @param {String} text
	 */
	compare: ({ hash, text }) => new Promise((resolve, reject) => {
		bcrypt.compare(text, hash, (err, compare) => {
			return err ? reject(err) : resolve(compare);
		});
	}),
};
