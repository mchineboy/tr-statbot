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
    return this.client.raw(
      `select a.url, b.title, count(b.title) as plays
      from playing a
      join songs b on a.url = b.url 
     where uid = '${uid}'
     and a.title is not null
     group by a.url, b.title
     order by 3 desc`
    );
  }

  async getMostLikedSong(uid: string) {
    return this.client.raw(
      `select a.url, b.title, (likes + grabs) * (hypes + 1) as likes
      from playing a
      join songs b on a.url = b.url 
      where a.uid = '${uid}'
      and a.title is not null
      order by 3 desc`
    );
  }

  async getOnlinePresence(uid: string) {
    return this.client.raw(`
      WITH time_diff AS (
        SELECT uid, timestamp, lead(timestamp) OVER (PARTITION BY uid ORDER BY timestamp) - timestamp as diff
        FROM chat
        WHERE uid = '${uid}'
        ),
        hourly_activity AS (
            SELECT uid, date_trunc('hour', timestamp) as hour, sum(diff) as time_diff
            FROM time_diff
            WHERE diff < interval '5 minutes' OR diff IS NULL
            GROUP BY uid, hour
        ),
        max_hourly_activity AS (
            SELECT uid, max(time_diff) as max_time_diff
            FROM hourly_activity
            GROUP BY uid
        )
        SELECT ha.uid as calc_uid, SUM(ha.time_diff) as total_time, EXTRACT(HOUR FROM ha.hour) as most_active_hours
        FROM hourly_activity ha
        JOIN max_hourly_activity ma ON ha.uid = ma.uid AND ha.time_diff = ma.max_time_diff
        GROUP BY ha.uid, ha.hour
        ORDER BY most_active_hours DESC;`);
  }
}
