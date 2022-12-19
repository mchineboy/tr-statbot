import mongoose from 'mongoose';
import chatStats from './stats/chat';
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    uid: String,
    timestamp: Number,
});

export default mongoose.model('chat', chatSchema);

export async function getChatStats(uid: string): Promise<any> {
    return await chatStats(uid);
}