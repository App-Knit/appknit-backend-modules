import mongoose from 'mongoose';
import momentTimezone from 'moment-timezone';


const Comment = new mongoose.Schema({
	content: {
		type: String,
		require: 'Content is Required',
	},

	date: { type: Date, default: new Date() },
	timezone: { type: String, default: momentTimezone.tz.guess() },

	toJSON: { virtuals: true },
	toObject: { virtuals: true },
	usePushEach: true,
});

Comment.virtual('post', {
	localField: 'ref',
	foreignField: '_id',
	ref: 'post',
	justOne: true,
});


const commentModel = mongoose.model('Comment', Comment);
export default commentModel;
