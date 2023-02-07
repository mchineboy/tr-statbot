import { Knex } from "knex";
import { formatInfo } from "../../util/console-helper";

export default async function Chat(knex: Knex) {
  formatInfo('Postgres', 'Creating chat table','💬')
  await knex.schema.hasTable("chat").then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable("chat", (table) => {
        table.bigIncrements("id").primary();
        table.string("uid");
        table.timestamp("timestamp");
        table.timestamps();
        table.index("uid");
        
        knex.raw(
          `create index if not exists chat_uid_timestamp on chat (uid, timestamp desc)`
        );
      });
    }
  });
}
