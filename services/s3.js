/**
 * @desc This module handles the AWS s3 actions. i.e uploading stuff to s3 bucker
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 *
 * @todo
 * 1. Handle proper error messages for missing required props using
 * PropsValidationUtility.
 */

import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import { ResponseUtility } from '../utility';

const { AWS_ACCESSID, AWS_SECRET, S3_BUCKET } = process.env;

const s3 = new AWS.S3({
	accessKeyId: AWS_ACCESSID,
	secretAccessKey: AWS_SECRET,
	Bucket: S3_BUCKET,
});
export default {
	/**
	  * Upload a file to s3 bucket
	  * @param {string} bucket	-> refers to the name of the bucket
	  * @param {object} file	-> refers to the file object to upload
	  */
	uploadToBucket: ({ Bucket, data, Key }) => new Promise((resolve, reject) => {
		if (Bucket && data && Key) {
			const params = {
				Bucket,
				Key,
				Body: data,
			};
			s3.upload(params, (err, uploadResponse) => {
				if (err) {
					reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading file', error: err }));
				} else {
					resolve(ResponseUtility.SUCCESS({ data: uploadResponse }));
				}
			});
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	}),

	uploadPublicObject: ({
		Bucket, data, Key, mime,
	}) => new Promise((resolve, reject) => {
		if (Bucket && data && Key) {
			const params = {
				ACL: 'public-read',
				Bucket,
				Key,
				Body: data,
				ContentType: mime,
			};

			s3.putObject(params, (err, response) => {
				if (err) {
					reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading file', error: err }));
				} else {
					resolve(ResponseUtility.SUCCESS({ data: response }));
				}
			});
		} else {
			reject(ResponseUtility.MISSING_PROPS())
		}
	}),

	uploadLocalFile: ({ Key, Bucket }) => new Promise((resolve, reject) => {
		fs.readFile(path.resolve(LOCAL_IMAGE_PATH, Key), (err, Body) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Cannot read local file', error: err }));
			} else {
				s3.putObject({ Bucket, Key, Body }, (putError, data) => {
					if (putError) {
						reject(ResponseUtility.GENERIC_ERR({ message: 'Error saving image to s3', error: putError }));
					} else {
						resolve(ResponseUtility.SUCCESS({ data }));
					}
				});
			}
		});
	}),
	/**
	  * Save the buffer image on s3
	  */
	putBuffer: ({ Bucket, Body, Key }) => new Promise((resolve, reject) => {
		s3.putObject({ Body, Bucket, Key }, (err, data) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Error uploading image to s3', error: err }));
			} else {
				resolve(ResponseUtility.SUCCESS({ data }));
			}
		});
	}),
	/**
	  * @desc Find a file in s3 bucket
	  * @param {String} bucket	-> name of bucket
	  * @param {String} key		-> name of file
	  */
	findFile: ({ Bucket, Key }) => new Promise((resolve, reject) => {
		const params = {
			Bucket,
			Key,
		};
		s3.getObject(params, (err, object) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ messafe: 'Error looking for file', error: err }));
			} else {
				resolve(ResponseUtility.SUCCESS({ data: object }));
			}
		});
	}),

	/**
	  * Remove the requested file
	  * @param {String} Bucket	-> the name of bucket to look for file
	  * @param {String} Key		-> the file name to delete
	  */
	removeFile: ({ Bucket, Key }) => new Promise((resolve, reject) => {
		if (Bucket && Key) {
			const params = { Bucket, Key };
			s3.deleteObject(params, (err) => {
				if (err) {
					reject(ResponseUtility.GENERIC_ERR({ message: 'Error deleting object', error: err }));
				} else {
					resolve(ResponseUtility.SUCCESS);
				}
			});
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	}),

	/**
	 * @desc this function creates a new folder inside a bucket
	 * @param {String} Bucket	-> the bucket to create a folder in
	 * @param {String} Key		-> the name of the folder to create
	 */
	createFolderInsideBucket: ({ Bucket, Key }) => new Promise((resolve, reject) => {
		const params = { Bucket, Key };

		s3.putObject(params, (err) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Error creating bucket', error: err }));
			} else {
				resolve(ResponseUtility.SUCCESS);
			}
		});
	}),

	/**
	 * API to list down the bucket content
	 * @param {String} bucket	-> the name of the bucket
	 * @param {String} Folder	-> name of the folder to fetch data from
	 */
	listBucketContent: ({ Bucket, Folder }) => new Promise((resolve, reject) => {
		const params = { Bucket, Prefix: `${Folder}/` };
		s3.listObjects(params, (err, objects) => {
			if (err) {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Error finding the bucket content', error: err }));
			} else {
				objects.Contents.splice(0, 1);
				const files = [];
				objects.Contents.map((object) => {
					const { Key } = object;
					const generateURL = `/owner/getClubPicture/${Key}`;
					files.push(generateURL);
				});
				resolve(ResponseUtility.SUCCESS({ data: files }));
			}
		});
	}),

	S3: s3,
};
