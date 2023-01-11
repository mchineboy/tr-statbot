import knex, { Knex } from "knex";
import Chat from "./schemas/chat";
import Playing from "./schemas/playing";
import Presence from "./schemas/presence";
import Users from "./schemas/users";
import CalcChatStats from "./stats/chat";

const schemas: any = {
  chat: Chat,
  playing: Playing,
  presence: Presence,
  users: Users,
};

export default class PostgresStats {
  client: Knex;
  isInitialized: boolean;
  constructor() {
    this.isInitialized = false;
    this.client = knex({
      client: "pg",
      connection: process.env.PG_URI,
      debug: true,
    });

    this.initialize();
  }

  async initialize() {
    for (const schema in schemas) {
      await schemas[schema](this.client);
    }

    this.isInitialized = true;
  }

  async storeChat(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return;
    }
    timestamp = Math.round(timestamp);
    return this.client("chat").insert({ uid, timestamp: this.client.raw('to_timestamp(?)', [timestamp])});
  }

  async storePresence(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return;
    }
    timestamp = Math.round(timestamp);
    return this.client("presence").insert({ uid, timestamp: this.client.raw('to_timestamp(?)', [timestamp])});
  }

  async storePlayer(uid: string, timestamp: number, song: any) {
    if (!this.isInitialized) {
      return;
    }
    timestamp = Math.round(timestamp);
    this.client("songs")
      .where({ song })
      .then((exists) => {
        if (!exists) {
          this.client("songs").insert({ song });
        }
      });
    return this.client("playing").insert({ uid, timestamp: this.client.raw('to_timestamp(?)', [timestamp]), song });
  }

  async storeUser(uid: string, optin: boolean) {
    if (!this.isInitialized) {
      return;
    }
    return this.client("users").insert({ uid, optin });
  }

  async checkStatus(uid: string) {
    if (!this.isInitialized) {
      return;
    }
    return this.client("users").where({ uid });
  }

  async getUser(uid: string, optin: boolean) {
    if (!this.isInitialized) {
      return;
    }

    return this.client("users").where({ uid, optin });
  }

  async playingHours(uid: string) {
    if (!this.isInitialized) {
      return;
    }
    return this.client.raw(`select
            sum(song.duration) as total
            from playing
            join song on song.url = playing.url
            where uid = '${uid}'
            group by uid`);
  }

  async getChatStats(uid: string) {
    if (!this.isInitialized) {
      return;
    }
    return this.client.raw(
      `select * from calculate_time_consumed_and_most_active_hours_single_uid('chat', '${uid}')`
    );
  }
}
