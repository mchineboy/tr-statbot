import StatBot from "./statbot";
import { formatError, formatInfo } from "./lib/util/console-helper";

async function main() {
  formatInfo("main", "Statbot starting @ " + new Date().toUTCString());
  return StatBot();
}

function fail(e: Error): never {
  formatError("main", e.message);
  process.exit(1);
}

export default main().catch(fail);
