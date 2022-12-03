import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    uid: String,
    optin: Boolean,
});

export default mongoose.model("users", userSchema);