import {Knex} from 'knex';

export default function Presence(knex: Knex) {
    return knex.schema.createTable("presence", (table) => {
        table.string("uid");
        table.timestamp("timestamp");
        table.timestamps();
    });
}