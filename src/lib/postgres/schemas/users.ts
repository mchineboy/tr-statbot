import { Knex } from "knex";

export default async function Users(knex: Knex) {
  console.info("Creating users table");
  await knex.schema.hasTable("users").then(async (exists) => {
    if (!exists) {
      return await knex.schema.createTable("users", (table) => {
        table.string("uid").primary();
        table.boolean("optin");
        table.timestamps();
      });
    }
  });
}
