import {Knex} from 'knex';

export default async function Presence(knex: Knex) {
    console.log("Creating presence table")
    return await knex.schema.createTableIfNotExists("presence", (table) => {
        table.string("uid");
        table.timestamp("timestamp");
        table.timestamps();
    });
}