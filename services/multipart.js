/**
 * This module deals with the middleware for on the fly multipart handler
 * before uploading it to s3. High Resolution Images are avoided.
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 * @todo handle multiple images upoad
 */
export default (req, res, next) => {
	const { files, body: { data, id } } = req;
	req.body = data ? JSON.parse(data) : {};
	if (id) {
		req.body.id = id;
	}
	if (files && Object.keys(files).length) {
		Object.keys(files).map((fileKey) => {
			req.body[fileKey] = files[fileKey].data;
		});
		next();
	} else {
		next();
	}
};
