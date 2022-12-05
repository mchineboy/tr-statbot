import mongoose from 'mongoose';
import {getTotalPlayingHours} from './stats/played';

const Schema = mongoose.Schema;

export const playingSchema = new Schema({
    uid: String,
    timestamp: Number,
    song: {
        "avatar": String,
        "dislikes": Number,
        "grabs": Number,
        "hypes": Number,
        "likes": Number,
        "songObj": {
          "channel": String,
          "duration": Number,
          "thumb": String,
          "title": String,
          "url": String,
        },
        "thumb": String,
        "time": Number,
        "title": String,
        "uid": String,
        "url": String,
        "username": String,
      }
});

export const totalPlayingHours = getTotalPlayingHours;

export default mongoose.model('playing', playingSchema);