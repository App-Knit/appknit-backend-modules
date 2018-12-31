import mongoose from 'mongoose';

import momentTimezone from 'moment-timezone';


const Posts = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Title is Required'],
		},
		content: {
			type: String,
			required: 'Content is Required',
		},


		date: { type: Date, default: new Date() },
		timezone: { type: String, default: momentTimezone.tz.guess() },
		picture: {
			type: String,
			required: true,
		},

		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		usePushEach: true,
	},
);

Posts.virtual('user', {
	localField: 'ref',
	foreignField: '_id',
	ref: 'comment',
	justOne: true,
});


const PostsModel = mongoose.model('Posts', Posts);
export default PostsModel;
