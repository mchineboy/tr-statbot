import { Knex } from "knex";

export default async function Users(knex: Knex) {
  console.log("Creating users table");
  await knex.schema.hasTable("users").then(async (exists) => {
    if (!exists) {
      return await knex.schema.createTableIfNotExists("users", (table) => {
        table.string("uid").primary();
        table.boolean("optin");
        table.timestamps();
      });
    }
  });
}
