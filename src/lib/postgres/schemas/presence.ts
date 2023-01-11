import { Knex } from "knex";

export default async function Presence(knex: Knex) {
  console.log("Creating presence table");
  await knex.schema.hasTable("presence").then(async (exists) => {
    if (!exists) {
      return await knex.schema.createTable("presence", (table) => {
        table.string("uid");
        table.timestamp("timestamp");
        table.timestamps();
      });
    }
  });
}
