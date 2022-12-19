import mongoose from 'mongoose';
import User from "./mongoose/users";
import Chat from "./mongoose/chat";
import Presence from "./mongoose/presence";
import Player, { totalPlayingHours } from "./mongoose/playing";

export default class MongoDB {
    client?: mongoose.Mongoose
    constructor() {
        this.main();
    }

    async main() {
        this.client = await mongoose.connect(process.env.MONGODB_URI!);
    }

    async checkStatus(uid:string) {
        return await User.findOne({ uid });
    }

    async getUser(uid: string, optin: boolean) {
        return User.findOne({ uid, optin });
    }

    async storeUser(uid: string, optin: boolean) {
        const user = new User({ uid, optin });
        return user.save();
    }

    async storeChat(uid: string, timestamp: number) {
        const chat = new Chat({ uid, timestamp });
        return chat.save();
    }

    async storePresence(uid: string, timestamp: number) {
        const presence = new Presence({ uid, timestamp });
        return presence.save();
    }

    async storePlayer(uid: string, timestamp: number, song: any) {
        const player = new Player({ uid, timestamp, song });
        return player.save();
    }

    async playingHours(uid: string) {
        return await totalPlayingHours(uid);
    }

    async mostActiveHour(uid: string) {
        
    }
}