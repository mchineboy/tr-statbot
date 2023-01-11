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
    return this.client("chat").insert({
      uid,
      timestamp: this.client.raw("to_timestamp(?)", [timestamp]),
    });
  }

  async storePresence(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return;
    }
    timestamp = Math.round(timestamp);
    return this.client("presence").insert({
      uid,
      timestamp: this.client.raw("to_timestamp(?)", [timestamp]),
    });
  }

  async storePlayer(uid: string, timestamp: number, song: any, songObj: any) {
    if (!this.isInitialized) {
      return;
    }
    timestamp = Math.round(timestamp);
    
    await this.client("songs")
      .insert({ ...songObj })
      .onConflict(["url"])
      .merge();
    return this.client("playing").insert({
      ...song,
      timestamp: this.client.raw("to_timestamp(?)", [timestamp]),
    });
  }

  async storeUser(uid: string, optin: boolean) {
    if (!this.isInitialized) {
      return;
    }
    return this.client("users")
      .insert({ uid, optin })
      .onConflict(["uid"])
      .merge();
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
            sum(songs.duration) as total
            from playing
            join songs on songs.url = playing.url
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

  async getTopSong(uid: string) {
    if (!this.isInitialized) {
      return;
    }
    return this.client.raw(
      `select a.url, b.title, count(b.title) as plays
      from playing a
      join songs b on a.url = b.url 
     where uid = ?
     group by a.url, b.title
     order by plays desc limit 1`, [uid]
    );
  }

  async getMostLikedSong(uid: string) {
    if (!this.isInitialized) {
      return;
    }
    return this.client.raw(
      `select a.url, b.title, (likes + grabs) * hypes as likes
      from playing a
      join songs b on a.url = b.url 
      where a.uid = ?
      order by likes desc limit 1`, [uid]
    );
  }
}
