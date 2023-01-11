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

    for (const schema in schemas) {
      this.client.schema.hasTable(schema).then((exists) => {
        if (!exists) {
          schemas[schema](this.client);
        }
      });
    }

    this.client.raw(
      `CREATE OR REPLACE FUNCTION calculate_time_consumed_and_most_active_hours_single_uid(tbl_name text, user_id int)
        RETURNS TABLE(uid int, total_time interval, most_active_hours int) AS $$
        BEGIN
            RETURN QUERY
            WITH time_diff AS (
                SELECT uid, timestamp, lead(timestamp) OVER (PARTITION BY uid ORDER BY timestamp) - timestamp as diff
                FROM tbl_name
                WHERE uid = user_id
            ),
            hourly_activity AS (
                SELECT uid, date_trunc('hour', timestamp) as hour, sum(diff) as time_diff
                FROM time_diff
                WHERE diff < interval '15 minutes' OR diff IS NULL
                GROUP BY uid, hour
            ),
            max_hourly_activity AS (
                SELECT uid, max(time_diff) as max_time_diff
                FROM hourly_activity
                GROUP BY uid
            )
            SELECT ha.uid, SUM(ha.time_diff) as total_time, EXTRACT(HOUR FROM ha.hour) as most_active_hours
            FROM hourly_activity ha
            JOIN max_hourly_activity ma ON ha.uid = ma.uid AND ha.time_diff = ma.max_time_diff
            GROUP BY ha.uid, ha.hour
            ORDER BY most_active_hours DESC;
        END;
        $$ LANGUAGE plpgsql;
        `
    );
    this.isInitialized = true;
  }

  async storeChat(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return;
    }
    return this.client("chat").insert({ uid, timestamp });
  }

  async storePresence(uid: string, timestamp: number) {
    if (!this.isInitialized) {
        return;
    }
    return this.client("presence").insert({ uid, timestamp });
  }

  async storePlayer(uid: string, timestamp: number, song: any) {
    if (!this.isInitialized) {
        return;
    }
    this.client("song")
      .where({ song })
      .then((exists) => {
        if (!exists) {
          this.client("song").insert({ song });
        }
      });
    return this.client("playing").insert({ uid, timestamp, song });
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
