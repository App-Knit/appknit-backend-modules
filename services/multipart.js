/**
 * This module deals with the middleware for on the fly multipart handler
 * before uploading it to s3. High Resolution Images are avoided.
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 * @todo handle multiple images upoad
 *
 * This multipart service will merge the passed images in the body with the same
 * name. There is a proposal to define a new service that handles the Mergin Multipart
 * data feature. MergingMulripart service will merge all the incoming binaries into a single
 * array to name binaries.
 */
export default (req, res, next) => {
	const {
		files, body: {
			data, id, AMQPConnection, AMQPChannel,
		},
	} = req;
	req.body = data ? (
		{ ...JSON.parse(data), AMQPConnection, AMQPChannel }) : { AMQPConnection, AMQPChannel };
	if (id) {
		req.body.id = id;
	}
	const fileKeys = Object.keys(files);
	if (files && fileKeys.length) {
		fileKeys.map((fileKey) => {
			if (fileKeys.length === 1 && fileKey !== 'images') {
				req.body[fileKey] = files[fileKey].data;
			} else if (!req.body.images) {
				req.body.images = [files[fileKey].data];
			} else {
				req.body.images.push(files[fileKey].data);
			}
		});
	}
	return next();
};
