import { Knex } from "knex";
import { formatInfo } from "../../util/console-helper";

export default async function Playing(knex: Knex) {
  formatInfo('Postgres', 'Creating playing table','⏯️')
  await knex.schema.hasTable("songs").then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable("songs", (table) => {
        table.string("url").primary();
        table.string("title");
        table.bigInteger("duration");
        table.string("channel");
        table.string("thumb");
        table.timestamps();
      });
    }
  });
  await knex.schema.hasTable("playing").then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable("playing", (table) => {
        table.bigIncrements("id").primary();
        table.string("uid");
        table.string("url");
        table.string("title");
        table.integer("time");
        table.string("username");
        table.string("avatar");
        table.string("thumb");
        table.integer("dislikes");
        table.integer("grabs");
        table.integer("hypes");
        table.integer("likes");
        table.timestamp("timestamp");
        table.foreign("url").references("songs.url");
        table.timestamps();
      });
    }
  });
}
