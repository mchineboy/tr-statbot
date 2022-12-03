import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const playingSchema = new Schema({
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

export default mongoose.model('playing', playingSchema);