import mongoose from "mongoose";
import User from "./mongoose/users";
import Chat, { getChatStats } from "./mongoose/chat";
import Presence from "./mongoose/presence";
import Player, { totalPlayingHours } from "./mongoose/playing";

export default class MongoDB {
  client?: mongoose.Mongoose;
  constructor() {
    this.main();
  }

  async main() {
    this.client = await mongoose.connect(process.env.MONGODB_URI!, {
      waitQueueTimeoutMS: 30000,
    });
    console.log(`MongoDB? ${this.client.connection.readyState}`);
  }

  async checkStatus(uid: string) {
    try {
      return await User.findOne({ uid });
    } catch (e) {
      console.error(`Error checking status for ${uid}!`);
      console.log(e);
    }
  }

  async getUser(uid: string, optin: boolean) {
    try {
      return User.findOne({ uid, optin });
    } catch (e) {
      console.error(`Error getting user ${uid}!`);
      console.log(e);
    }
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

  async getChatStats(uid: string) {
    return await getChatStats(uid);
  }
}
