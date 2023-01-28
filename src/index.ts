import StatBot from './statbot';
async function main() {
  console.info("Statbot starting @ " + new Date().toUTCString());
  return StatBot();
}

export default main().catch(console.error);
