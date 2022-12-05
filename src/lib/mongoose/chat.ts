import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const chatSchema = new Schema({
    uid: String,
    timestamp: Number,
});

export default mongoose.model('chat', chatSchema);

