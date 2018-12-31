// eslint-disable-next-line experimentalDecorators
import mongoose from 'mongoose';


const Vote = new mongoose.Schema({
	ref: { type: String, required: true },
	by: { type: String, required: true },
});

const VoteModel = mongoose.model('Vote', Vote);
export default VoteModel;
