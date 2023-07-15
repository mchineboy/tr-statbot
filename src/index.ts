import StatBot from "./statbot";
import * as logger from "./lib/util/console-helper";

async function main() {
  logger.formatInfo("main", "Statbot starting @ " + new Date().toUTCString());
  return StatBot();
}

function fail(e: Error): never {
  logger.formatError("main", e.message);
  process.exit(1);
}

export default main().catch(fail);
