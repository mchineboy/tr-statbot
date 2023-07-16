import knex, { Knex } from "knex";
import Chat from "./schemas/chat";
import Playing from "./schemas/playing";
import Presence from "./schemas/presence";
import Users from "./schemas/users";
import { env } from "../../env";
import { dye, Logger } from "../util/console-helper";

const schemas: Record<string, (knex: Knex) => Promise<void>> = {
  chat: Chat,
  playing: Playing,
  presence: Presence,
  users: Users,
};

type UserStatus = { uid: string; optin: boolean };

export default class PostgresStats extends Logger {
  client: Knex;
  isInitialized: boolean;

  constructor() {
    super("Postgres");
    this.isInitialized = false;
    this.client = knex({
      client: "pg",
      connection: env.PG_URI,
    });

    this.initialize();
  }

  async initialize() {
    for (const schema in schemas) {
      try {
        await schemas[schema](this.client);
      } catch (e) {
        const { message } = e as Error;
        this.error(dye`Initialization of schema [${schema}] failed: ${message}`);
        process.exit(1);
      }
    }

    this.isInitialized = true;
  }

  async storeChat(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return Promise.reject("Postgres Connection not initialized!");
    }
    timestamp = Math.round(timestamp);
    return this.client("chat").insert({
      uid,
      timestamp: this.client.raw("to_timestamp(?)", [timestamp]),
    });
  }

  async storePresence(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return Promise.reject("Postgres Connection not initialized!");
    }
    timestamp = Math.round(timestamp);
    return this.client("presence").insert({
      uid,
      timestamp: this.client.raw("to_timestamp(?)", [timestamp]),
    });
  }

  async storePlayer(uid: string, timestamp: number, song: Record<string, unknown>, songObj: Record<string, unknown>) {
    if (!this.isInitialized) {
      return Promise.reject("Postgres Connection not initialized!");
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

  async storeUserStatus(uid: string, optin: boolean) {
    if (!this.isInitialized) {
      return Promise.reject("Postgres Connection not initialized!");
    }

    return this.client("users").insert({ uid, optin }).onConflict(["uid"]).merge();
  }

  async checkStatus(uid: string): Promise<UserStatus> {
    if (!this.isInitialized) {
      return Promise.reject("Postgres Connection not initialized!");
    }

    const res = await this.client("users")
      .where({ uid })
      .then((res) => res as [UserStatus]);

    if (!res?.length) {
      return Promise.reject("No User found with UID: " + uid);
    }

    return res[0];
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
    return this.client.raw(`select sum(songs.duration) as total
                            from playing
                                     join songs on songs.url = playing.url
                            where uid = '${uid}'
                            group by uid`);
  }

  async getChatStats(uid: string) {
    if (!this.isInitialized) {
      return;
    }
    const totalTime = await this.client.raw(
      `
          WITH timestamps AS (SELECT uid,
                                     timestamp,
                                     LAG(timestamp, 1) OVER (PARTITION BY uid ORDER BY timestamp) AS prev_timestamp
                              FROM chat
                              WHERE uid = '${uid}')
          SELECT SUM(EXTRACT(EPOCH FROM timestamp - prev_timestamp)) AS total_elapsed_time
          FROM timestamps
          WHERE prev_timestamp IS NOT NULL
            AND timestamp - prev_timestamp <= INTERVAL '5 minutes';`
    );

    const activeHours = await this.client.raw(`
        WITH timestamps AS (SELECT uid,
                                   timestamp,
                                   LAG(timestamp, 1) OVER (PARTITION BY uid ORDER BY timestamp) AS prev_timestamp
                            FROM chat
                            WHERE uid = '${uid}'),
             elapsed_times AS (SELECT SUM(EXTRACT(EPOCH FROM timestamp - prev_timestamp)) AS total_elapsed_time
                               FROM timestamps
                               WHERE prev_timestamp IS NOT NULL
                                 AND timestamp - prev_timestamp <= INTERVAL '10 minutes')
        SELECT EXTRACT(HOUR from timestamp) AS hour, COUNT(*) AS count
        FROM chat
        WHERE uid = '${uid}'
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 1
    `);
    return {
      totalTime: totalTime.rows[0].total_elapsed_time,
      activeHours: activeHours.rows[0].hour,
    };
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
      `select a.url, b.title, (likes + grabs) as likes
       from playing a
                join songs b on a.url = b.url
       where a.uid = '${uid}'
         and a.title is not null
       order by 3 desc`
    );
  }

  async getOnlinePresence(uid: string): Promise<Knex.Raw<unknown>> {
    return this.client.raw(`select calculate_presence_duration('${uid}') as total;`);
  }
}
