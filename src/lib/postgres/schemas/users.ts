import { Knex } from "knex";
import { formatInfo } from "../../util/console-helper";

export default async function Users(knex: Knex) {
  formatInfo('Postgres', 'Creating users table','👤')
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
