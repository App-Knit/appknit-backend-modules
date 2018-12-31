
import mongoose from 'mongoose';

const user = new mongoose.Schema(
	{
		name: {
			type: String,
			required: 'true',
		},
		email: {
			type: String,
			required: 'true',
		},
		password: {
			type: String,
			required: 'password is required',
		},

	},
);

const UserModel = mongoose.model('User', user);
export default UserModel;
