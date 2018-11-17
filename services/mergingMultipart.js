/**
 * @desc handle multipart as array of buffers
 * for multiple files
 * @author gaurav sharma
 * @since 17nd November 2018
 * Adapted while Faraya Application
 */
export default (req, res, next) => {
	const { files, body: { data, id } } = req;
	req.body = data ? JSON.parse(data) : {};
	if (id) {
		req.body.id = id;
	}
	if (files && Object.keys(files).length) {
		Object.keys(files).map((fileKey) => {
			if (!req.body.images) {
				req.body.images = [files[fileKey].data];
			} else {
				req.body.images.push(files[fileKey].data);
			}
		});
	}
	return next();
};
