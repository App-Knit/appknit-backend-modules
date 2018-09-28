/**
 * this utility function handles the parsing of utility messages and returns an object returning
 * whether the requested object validates or not. If yes it returns object with true
 * if not, it returns an object with the respective missing values. This will help to
 * send missing props values rather than generic missing required props error
 * @author gaurav sharma
 * @since 28th September 2018
 *
 * @param {Array} validProps, an array representing the valid properties to find in the sourceDocument
 * @param {Object} sourceDocument, an object to check for valid properties inside.
 */
export default ({ validProps, sourceDocument }) => new Promise((resolve, reject) => {
	if (validProps && sourceDocument) {
		const missingProps = [];
		validProps.map((property) => {
			if (sourceDocument[property] === undefined) {
				missingProps.push(property);
			}
		});
		let message = '';
		if (missingProps.length) {
			message = `Missing required ${missingProps.length > 1 ? 'properties' : 'property'}`;

			// missingProps.forEach(missingProperty => message += `${missingProperty}, `);
			missingProps.map((missingProperty, index) => {
				if (index === missingProps.length - 1 && missingProps.length > 1) {
					message = `${message.substring(0, message.length - 1)} and ${missingProperty}.`;
				} else {
					message += ` ${missingProperty},`;
				}
			});
		} else {
			message = 'Validated';
		}
		message = message.trim().substring(0, message.trim().length - 1);
		return resolve({ code: missingProps.length ? 102 : 100, message });
	}
	const error = { code: 101, message: 'Needs to pass validProps and sourceDocument to check.' };
	return reject(error);
});
