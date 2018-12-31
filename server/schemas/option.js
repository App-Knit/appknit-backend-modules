const mongoose = require('mongoose');

const Option = new mongoose.Schema(
	{
		ref: { type: String, required: true },
		by: { type: String, required: true },
	},

);

const OptionModel = mongoose.model('Option', Option);
export default OptionModel;
