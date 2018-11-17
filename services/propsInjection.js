/**
 * @description
 * This is the conceptual middleware that handles the custom JSON property to
 * incoming body and hence pass to the modelPromise funciton. The property injection
 * allows to use the same API in multiple ways.
 * @author gaurav sharma
 * @since 2nd November 2018
 * @example
 * export default app => {
 * 		app.post(`${prefix}create`, MergingMultipartService, AuthenticationControllers.authenticateUser, VenueControllers.create);
 * 		app.post(`${prefix}details`, AuthenticationControllers.authenticateUser, VenueControllers.details);
 * 		app.post(`${prefix}update`, MergingMultipartService,PropsInjectionService({ update: true }), AuthenticationControllers.authenticateUser, VenueControllers.create);
 *	}
}
 */
export default (property) => {
	const safeKeys = ['id'];
	return (req, res, next) => {
		const { body: { data, id }, body } = req;
		req.body = data ? JSON.parse(data) : body ? body : {};
		if (id) {
			req.body.id = id;
		}
		Object.keys(property).map((key) => {
			if (!safeKeys.includes(key)) {
				req.body[key] = property[key];
			}
		});
		next();
	};
};
