import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const presenceSchema = new Schema({
    uid: String,
    timestamp: Number,
});

export default mongoose.model('presence', presenceSchema);
