import { Knex } from "knex";

export default function Users(knex: Knex) {
  return knex.schema.createTableIfNotExists("users", (table) => {
    table.string("uid").primary();
    table.boolean("optin");
    table.timestamps();
  });
}