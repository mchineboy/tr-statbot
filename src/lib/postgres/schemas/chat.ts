import {Knex} from 'knex';

export default async function Chat(knex: Knex) {
    console.log("Creating chat table")
    await knex.schema.createTableIfNotExists("chat", (table) => {
        table.bigIncrements("id").primary();
        table.string("uid");
        table.timestamp("timestamp");
        table.timestamps();
        table.index("uid");
        knex.raw(`create index chat_uid_timestamp on chat (uid, timestamp desc)`);
    });
    return true;
}